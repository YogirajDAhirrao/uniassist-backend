import { prisma } from "./src/lib/prisma.js";

await prisma.course.create({
  data: {
    id: 4,
    name: "MCA",
  },
});

await prisma.$disconnect();
