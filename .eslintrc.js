module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true,
        "jest": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2018
    },
    "rules": {
        "indent": [
            "error",
            4,
            { "SwitchCase": 1 }
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": "off",
        "prefer-arrow-callback": "error",
        "no-var": "error",
        "prefer-const": "error",
        "eqeqeq": [
            "error",
            "always",
            { "null": "ignore" }
        ],
        "no-else-return": "error",
        "strict": [
            "error",
            "global"
        ]
    }
};