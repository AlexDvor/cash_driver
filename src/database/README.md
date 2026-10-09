# Local persistence

`connection.ts` opens `cash-driver.sqlite` once and retries initialization failures without deleting data. `migrations.ts` checks integrity, rejects unsupported versions and applies transactional, non-destructive schema migrations (v1 transactions, v2 preferences). `sqlite.ts` describes the small connection API used by native OP-SQLite and real SQLite integration tests.

`serializedConnection.ts` queues public reads and transactions together; transaction callbacks must use their supplied executor. This prevents reads from seeing values that may still roll back.

Feature repositories own parameterized CRUD SQL. Services reuse the domain validators, calculate cents and emit change notifications after commit. Preferences use the same database. Phase 7 resolves the owner-delegated initial haptics choice to disabled: schema version 3 converts only former `NULL` choices to `DEFAULT_HAPTICS_ENABLED`, preserving explicit enabled/disabled values.
