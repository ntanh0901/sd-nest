module.exports = {
    extends: [
        "next",
        "next/core-web-vitals",
        "prettier",
        "plugin:@next/next/recommended",
        "plugin:jsx-a11y/recommended",
    ],
    plugins: ["jsx-a11y", "validate-jsx-nesting"],
    rules: {
        "jsx-a11y/no-redundant-roles": "warn",
        "jsx-a11y/no-static-element-interactions": "warn",
        "jsx-a11y/click-events-have-key-events": "warn",
        "jsx-a11y/anchor-is-valid": "error",
        "validate-jsx-nesting/no-invalid-jsx-nesting": "error",
    },
    parserOptions: {
        babelOptions: {
            presets: [require.resolve("next/babel")],
        },
    },
};
