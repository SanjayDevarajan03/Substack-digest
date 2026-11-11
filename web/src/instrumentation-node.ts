import { getAllUsers } from "./models/user";
import { buildCronExpression } from "./jobs/scheduler";

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
