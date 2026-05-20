import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  try {
    console.log("=== TOTAL AUDIT LOGS ===");
    const totalLogs = await prisma.auditLog.count();
    console.log(`Total audit logs: ${totalLogs}`);
    
    console.log("\n=== AUDIT LOGS BY ACTION ===");
    const actionCounts = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: { id: true }
    });
    actionCounts.forEach(item => {
      console.log(`${item.action}: ${item._count.id}`);
    });
    
    console.log("\n=== DETAILED VIEW OF ALL AUDIT LOGS ===");
    const allLogs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" } });
    allLogs.forEach((log, i) => {
      console.log(`${i+1}. ID: ${log.id}, Action: ${log.action}, UserId: ${log.userId}, CreatedAt: ${log.createdAt}, Entity: ${log.entityType}/${log.entityId}`);
    });
  } finally {
    await prisma.$disconnect();
  }
})();
