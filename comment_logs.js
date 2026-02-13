const fs = require('fs');
const path = require('path');

const files = [
    'backend/utils/otpEmailService.js',
    'backend/utils/migration.js',
    'backend/utils/migrateVibes.js',
    'backend/utils/migrateCaptions.js',
    'backend/utils/emailMonitor.js',
    'backend/socket/socket.js',
    'backend/services/auraCleanupService.js',
    'backend/routes/testRoutes.js',
    'backend/routes/authRoutes.js',
    'backend/monitoring/index.js',
    'backend/monitoring/alertManager.js',
    'backend/monitoring/emailService.js',
    'frontend/src/pages/UserAccount.jsx',
    'frontend/src/pages/Search.jsx',
    'frontend/src/pages/Register.jsx',
    'frontend/src/pages/PostDetail.jsx',
    'frontend/src/pages/Notifications.jsx',
    'frontend/src/pages/ChatPage.jsx',
    'frontend/src/pages/Account.jsx',
    'frontend/src/context/StoriesContext.jsx',
    'frontend/src/context/PostContext.jsx',
    'frontend/src/context/NotificationContext.jsx',
    'frontend/src/context/ChatContext.jsx',
    'frontend/src/components/PostCard.jsx',
    'frontend/src/components/RightBar.jsx',
    'frontend/src/components/VibeModal.jsx',
    'frontend/src/components/ShareModal.jsx',
    'frontend/src/components/CommentItem.jsx',
    'frontend/src/components/chat/MessageInput.jsx',
    'frontend/src/components/chat/MessageContainer.jsx'
];

files.forEach(relativePath => {
    const filePath = path.join(__dirname, relativePath);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/);
        let modified = false;

        const newLines = lines.map(line => {
            const trimmed = line.trim();
            // Only comment out if it contains console.log( and isn't already commented
            if (trimmed.includes('console.log(') && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
                modified = true;
                return line.replace('console.log(', '// console.log(');
            }
            return line;
        });

        if (modified) {
            fs.writeFileSync(filePath, newLines.join('\n'));
            console.log(`Updated: ${relativePath}`);
        }
    } else {
        console.log(`Not found: ${relativePath}`);
    }
});
