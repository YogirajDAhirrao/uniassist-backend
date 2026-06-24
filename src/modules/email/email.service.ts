import { prisma } from "../../lib/prisma.js";
import { sendEmail } from "../../utils/mailer.js";

export class EmailService {
  async sendToCourse(
    senderId: string,
    subject: string,
    body: string,
    courseId: number,
  ) {
    const users =
      courseId === 1
        ? await prisma.user.findMany({
            select: {
              id: true,
              email: true,
            },
          })
        : await prisma.user.findMany({
            where: {
              courseId,
            },
            select: {
              id: true,
              email: true,
            },
          });

    if (users.length === 0) {
      throw new Error("No recipients found");
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        body,
        courseId,
        senderId,
        status: "SENDING",
        totalRecipients: users.length,
      },
    });

    const recipientRecords = users.map((user) => ({
      campaignId: campaign.id,
      userId: user.id,
      email: user.email,
    }));

    await prisma.emailRecipient.createMany({
      data: recipientRecords,
    });

    let sentCount = 0;
    let failedCount = 0;

    const recipients = await prisma.emailRecipient.findMany({
      where: {
        campaignId: campaign.id,
      },
    });

    for (const recipient of recipients) {
      try {
        await sendEmail(recipient.email, campaign.subject, campaign.body);

        await prisma.emailRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });

        sentCount++;
      } catch (error: any) {
        await prisma.emailRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            status: "FAILED",
            errorMessage: error.message,
          },
        });

        failedCount++;
      }
    }

    await prisma.emailCampaign.update({
      where: {
        id: campaign.id,
      },
      data: {
        status: failedCount > 0 ? "FAILED" : "SENT",
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
    });

    return {
      campaignId: campaign.id,
      totalRecipients: users.length,
      sentCount,
      failedCount,
    };
  }

  async getCampaignHistory() {
    return prisma.emailCampaign.findMany({
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        course: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getCampaignById(campaignId: string) {
    const campaign = await prisma.emailCampaign.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        course: true,
        recipients: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    return campaign;
  }

  async getRecipients(campaignId: string) {
    return prisma.emailRecipient.findMany({
      where: {
        campaignId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async retryFailedEmails(campaignId: string) {
    const failedRecipients = await prisma.emailRecipient.findMany({
      where: {
        campaignId,
        status: "FAILED",
      },
    });
    const campaign = await prisma.emailCampaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }
    let resent = 0;

    for (const recipient of failedRecipients) {
      try {
        await sendEmail(recipient.email, campaign.subject, campaign.body);

        await prisma.emailRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            status: "SENT",
            sentAt: new Date(),
            errorMessage: null,
          },
        });

        resent++;
      } catch (error: any) {
        await prisma.emailRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            errorMessage: error.message,
          },
        });
      }
    }

    return {
      retried: failedRecipients.length,
      resent,
    };
  }
}
