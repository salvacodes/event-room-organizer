# Rules

* Never make any commit, let me make the commits manually. For context, the intention is to work with trunk based development, so no PR's and excepcionally some short lived branches. 

* Work in Test Driven Development mode, following the cycle: 
  1. Create failing tests. ALWAYS create behavior tests only. NEVER test for look and feel and design.
  2. Make the test pass. ALWAYS Run all the tests when verifying with `npm test`. NEVER run individual tests. 
  3. Wait for user input on possible refactoring or changes before moving to the next iteration of the cycle

* To verify any changes performed, ALWAYS use the following commands: 
  - `npm run check:type` to validate types in TypeScript
  - `npm run check:fix` to apply formatting and linting
  - `npm run test` to run the unit tests
