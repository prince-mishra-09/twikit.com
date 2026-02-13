import User from "../models/userModel.js";

export const migrateUsernames = async () => {
    try {
        const users = await User.find({ username: { $exists: false } });

        if (users.length === 0) {
            // console.log("Migration: All users already have usernames.");
            return;
        }

        // console.log(`Migration: Found ${users.length} users without usernames. Starting migration...`);

        for (const user of users) {
            let baseUsername = user.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            if (!baseUsername) baseUsername = "user"; // Fallback if name is empty or only special chars

            let newUsername = baseUsername;
            let counter = 1;

            // Check for collisions
            while (await User.findOne({ username: newUsername })) {
                newUsername = `${baseUsername}_${counter}`;
                counter++;
            }

            user.username = newUsername;
            await user.save();
            // console.log(`Migrated: ${user.name} -> @${newUsername}`);
        }

        // console.log("Migration: Completed successfully.");

    } catch (error) {
        console.error("Migration Error:", error);
    }
};
