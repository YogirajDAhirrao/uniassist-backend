import nodemailer from "nodemailer";
export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});
export async function sendEmail(to, subject, body) {
    return transporter.sendMail({
        from: `"UniAssist" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: body,
        html: `
      <div>
        <h2>${subject}</h2>
        <p>${body}</p>
      </div>
    `,
    });
}
//# sourceMappingURL=mailer.js.map