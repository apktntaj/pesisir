# Check Lartas

Use this skill when the user asks whether an HS code
is subject to import/export restrictions. If user input is a file then extract the HS codes from the file and check them all.

## Procedure

1. Accept one HS code or a list of HS codes.
2. Validate that each HS code contains 8 digits.
3. Query the regulator data source.
4. Extract:
   - HS code
   - description
   - lartas status
   - regulation
   - required permit
5. Never infer lartas status yourself.
6. If regulator data cannot be retrieved, report it as unknown.
7. Present the result as a table.