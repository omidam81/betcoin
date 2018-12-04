# /UNIT/locales

Language injected into ejs templates as locals.

Tries to use most accurate locale based on config.

If config is set to en_US, will try to use:

`/UNIT/locales/en/us/lang.json`

If it doesn't exist it falls back to:

`/UNIT/locales/en/lang.json`

If config is just set to en, it will always use:

`/UNIT/locales/en/lang.json`