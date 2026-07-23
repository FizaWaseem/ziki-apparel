const bcrypt = require('bcryptjs');

bcrypt.compare('admin123', '$2b$12$CqEVEqLsbcocHXPpubSbSeh85mLlgX9wh4s7Sy3mNNaQUWpOAbsRO', (err, result) => {
    console.log('Password Match:', result);
    console.log('Error:', err);
    process.exit(0);
});
