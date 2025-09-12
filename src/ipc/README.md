# IPC Contract

| Channel         | Request Payload          | Response             | Error Codes               |
|-----------------|--------------------------|----------------------|---------------------------|
| `people:list`   | none                     | `Person[]`           | -                         |
| `people:get`    | `id: string`             | `Person \| undefined` | `NOT_FOUND`               |
| `people:save`   | `person: Person`         | `Person`             | `VALIDATION_ERROR`        |
| `people:delete` | `id: string`             | `true`               | `NOT_FOUND`               |

Errors are thrown with an object containing `{ code, message }` when applicable.
