import { getAllUsers } from "./models/user";
import { buildCronExpression } from "./jobs/scheduler";

console.log(
    "Server clock:",
    new Date().toString(),
    "| System timezone:",
    Intl.DateTimeFormat().resolvedOptions().timeZone,
);

const users = await getAllUsers();
console.log(users);
for (const user of users) {
    await buildCronExpression(
        user.email,
        user.cadence,
        user.day ?? "",
        user.time,
        user.month ?? "",
        user.dateOfMonth ?? "",
    );
}
