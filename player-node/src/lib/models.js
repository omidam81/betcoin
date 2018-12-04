module.exports = {
    User: {
        id: 'User',
        required: ['email', 'password'],
        properties: {
            alias: {
                type: 'string',
                description: 'Alias should be a string with length greater than or equal to 4.'
            },
            email: {
                type: 'string',
                description: 'User register email'
            },
            password: {
                type: 'string',
                description: 'Password should be a string greater or equal to 10 characters containing numeric digits.'
            },
            createWallet: {
                type: 'boolean',
                description: 'Indicate whether or not to create wallet on user creation.'
            },
            withdrawAddress: {
                type: 'string',
                description: 'Wallet address. If this field presented without the createWallet flag, it will be verified and attached to the user created.'
            }
        }
    }
};