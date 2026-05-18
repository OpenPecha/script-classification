# API Reference

All requests go to the base URL configured in `VITE_BASE_URL`. The Axios instance lives in `src/lib/axios.ts`. The application identifier used in URL segments is `scriptclassification` (from `src/lib/constant.ts`).

## Authentication

Requests that require authentication must include:

```
Authorization: Bearer <Auth0 JWT>
```

Use `getAuthHeaders()` from `src/lib/auth.ts` to build headers.

---

## Script Types

### `GET /script-type/`

Returns the full list of 31 Tibetan script styles. Prefetched at app startup with `staleTime: Infinity`.

**Response** `ScriptStyle[]`

```ts
interface ScriptStyle {
  id: ScriptType        // e.g. "uchen", "druma"
  name_en: string
  name_bo: string | null
  parent: ScriptType | null   // null = top-level style
}
```

---

## Users

### `GET /user/by-identifier/{email}`

Fetches the backend user record for an authenticated email. Called during the Auth0 post-login sync.

**Path params:** `email` — the user's email address.

**Response** `User`

```ts
interface User {
  id?: string
  username?: string
  email: string
  role?: UserRole         // "admin" | "annotator" | "reviewer" | "final reviewer"
  group_name?: string
  group_id?: string
  picture?: string
  createdAt?: Date
}
```

---

### `GET /user/`

Paginated, filterable list of all users.

**Query params**

| Param | Type | Description |
|---|---|---|
| `search` | string | Filter by username or email |
| `role` | `UserRole` | Filter by role |
| `group_id` | string | Filter by group |
| `offset` | number | Pagination offset (default 0) |
| `limit` | number | Page size (default 50) |

**Response** `UserListResponse`

```ts
interface UserListResponse {
  items: User[]
  total: number
  limit: number
  offset: number
}
```

---

### `POST /user/`

Creates a new user.

**Body** `CreateUserDTO`

```ts
interface CreateUserDTO {
  username?: string
  email: string
  role?: UserRole
  group_id?: string
  picture?: string
}
```

**Response** `User`

---

### `PUT /user/{id}`

Updates an existing user.

**Path params:** `id` — user ID.

**Body** `UpdateUserDTO`

```ts
interface UpdateUserDTO {
  new_username?: string
  new_email?: string
  new_role?: UserRole
  new_group_id?: string
}
```

**Response** `User`

---

### `DELETE /users/{id}`

Deletes a user.

**Path params:** `id` — user ID.

**Response** `void`

---

### `GET /contributions/{group_id}/summary`

Group-level annotator/reviewer contribution totals. Used by the **User contributions** admin page.

**Path params:** `group_id` — group UUID.

**Query params (optional)**

| Param | Type | Description |
|---|---|---|
| `start_date` | `YYYY-MM-DD` | First day of the range (**inclusive**) |
| `end_date` | `YYYY-MM-DD` | Last day of the range (**inclusive**) |

Omit both params for all-time (overall) totals.

**Response** `GroupContributionSummaryResponse` (see `src/types/contributions.ts`).

---

### `GET /tasks/scriptclassification/{userId}/contributions`

Returns a user's contribution summary for a given date range.

**Path params:** `userId` — user ID.

**Query params**

| Param | Type | Description |
|---|---|---|
| `start_date` | string (ISO 8601) | Start of range (inclusive) |
| `end_date` | string (ISO 8601) | End of range (inclusive) |

**Response** `UserContributionResponse`

```ts
interface UserContributionResponse {
  total_count: number
  approved_count: number
  reviewed_count: number
  rejection_count: number
  items: UserContribution[]
}

interface UserContribution {
  task_id: string
  name: string
  batch_name: string
  updated_time: string
  role: 'annotator' | 'reviewer' | 'final reviewer'
  script_type: string | null
  approved: boolean | null
  reviewed: boolean | null
  rejection_count: number
}
```

---

## Groups

### `GET /group/`

Returns all groups.

**Response** `Group[]`

```ts
interface Group {
  id: string
  name: string
}
```

---

### `POST /group/`

Creates a group.

**Body** `GroupRequest`

```ts
interface GroupRequest {
  name: string
}
```

**Response** `Group`

---

### `PUT /group/{id}`

Updates a group.

**Path params:** `id` — group ID.

**Body** `GroupUpdateRequest`

```ts
interface GroupUpdateRequest {
  name: string
}
```

**Response** `Group`

---

### `DELETE /group/{id}`

Deletes a group.

**Path params:** `id` — group ID.

**Response** `{ success: boolean; message?: string }`

---

### `GET /group/{id}/users`

Returns the list of users assigned to a group.

**Path params:** `id` — group ID.

**Response** `User[]`

---

## Batches

### `GET /application/scriptclassification/batches`

Returns all batches for the application.

**Response** `Batch[]`

```ts
interface Batch {
  id: string
  name: string
  created: string
  group_id: string
  group_name: string
}
```

---

### `GET /batch/application/scriptclassification/reports`

Returns aggregated statistics across all batches for the application.

**Response** `ApplicationBatchReport`

```ts
interface ApplicationBatchReport {
  id: string
  name: string
  created: string
  group_id: string
  total_tasks: number
  pending: number
  half_annotated: number
  annotated: number
  accepted: number
  trashed: number
  script_types?: Record<string, number>
}
```

---

### `GET /batch/{batchId}/report`

Returns statistics for a single batch.

**Path params:** `batchId`

**Response** `BatchReport` (extends `Batch` with the same stat fields as `ApplicationBatchReport`)

---

### `GET /batch/{batchId}/tasks`

Returns all tasks in a batch, optionally filtered by state.

**Path params:** `batchId`

**Query params**

| Param | Type | Description |
|---|---|---|
| `state` | `BatchTaskState` | Optional filter: `pending \| half_annotated \| annotated \| accepted \| trashed` |

**Response** `BatchTask[]`

```ts
interface BatchTask {
  task_id: string
  task_name: string
  task_url: string
  orientation: 'landscape' | 'portrait'
  state: BatchTaskState
  annotator_a_username: string | null
  classification_a: string | null
  annotator_b_username: string | null
  classification_b: string | null
  reviewer_username: string | null
  final_script: string | null
  trashed_by: string | null
}
```

---

### `POST /tasks/scriptclassification/`

Creates a new batch by uploading tasks.

**Body** `BatchUploadRequest`

```ts
interface BatchUploadRequest {
  batch_name: string
  group_id: string
  tasks: BatchUploadTask[]
}

interface BatchUploadTask {
  name: string
  url: string
  transcript?: string | null
  orientation?: 'landscape' | 'portrait' | null
}
```

**Response** `void`

---

### `GET /batch/scriptclassification/{batchId}/export`

Returns detailed per-task data for CSV export.

**Path params:** `batchId`

**Response** `BatchExportResponse`

```ts
interface BatchExportResponse {
  batch_name: string
  tasks: BatchExportTask[]
}

type BatchExportTask = {
  file_number: string
  image_url: string
  orientation: 'landscape' | 'portrait' | null
  status: BatchTaskState
  annotator_a_username: string | null
  classification_a: string | null
  annotator_b_username: string | null
  classification_b: string | null
  reviewer_username: string | null
  final_script: string | null
  trashed_by: string | null
}
```

---

## Classification Tasks (Workspace)

### `GET /tasks/scriptclassification/assign/{userId}`

Fetches the next task assigned to the user, or `null` if no task is available.

**Path params:** `userId`

**Response** `ClassificationTask | null`

```ts
interface ClassificationTask {
  task_id: string
  state: 'annotating' | 'annotating_b' | 'reviewing'
  batch_id: string
  group_id: string
  task_name: string
  task_url: string
  orientation: 'landscape' | 'portrait'
  classification_a: ScriptType | null
  classification_b: ScriptType | null
  rejection_count: number
}
```

Returns `404` when no task is available (the frontend treats this as `null`).

---

### `POST /tasks/scriptclassification/submit/{taskId}`

Submits or trashes a task. Used by both annotators and reviewers.

**Path params:** `taskId`

**Body** — one of three shapes:

**Annotator — submit classification**

```ts
{
  user_id: string
  submit: true
  script_type: ScriptType
}
```

**Annotator — trash task**

```ts
{
  user_id: string
  submit: false
}
```

**Reviewer — pick an answer**

```ts
{
  user_id: string
  submit: true
  choice: 'a' | 'b' | 'own'
  script_type?: ScriptType   // required when choice === "own"
}
```

**Response**

```ts
{
  message: string
  next_task: ClassificationTask | null
}
```

The client updates the query cache directly with `next_task` instead of triggering a refetch.

---

### `POST /tasks/scriptclassification/{taskId}/restore`

Restores a trashed task back to its previous state (admin only).

**Path params:** `taskId`

**Response** `void`

---

## TanStack Query Integration

Every endpoint has a corresponding hook and query-key factory in the `api/` subfolder of its feature. Mutations call `queryClient.invalidateQueries` with the relevant key on success.

| Hook | Source file |
|---|---|
| `useGetScriptTypes` | `src/features/workspace/api/script-type/get-script-types.ts` |
| `useGetClassificationTask` | `src/features/workspace/api/classification/assign-classification-task.ts` |
| `useSubmitClassification` | `src/features/workspace/api/classification/submit-classification.ts` |
| `useGetUsers` / `useGetAllUsers` | `src/features/admin/api/user/get-users.ts` |
| `useCreateUser` | `src/features/admin/api/user/create-user.ts` |
| `useUpdateUser` | `src/features/admin/api/user/update-user.ts` |
| `useDeleteUser` | `src/features/admin/api/user/delete-user.ts` |
| `useGetUserContributions` | `src/features/admin/api/user/get-user-contributions.ts` |
| `useGetGroups` | `src/features/admin/api/group/get-group.ts` |
| `useGetGroupUsers` | `src/features/admin/api/group/get-group-with-users.ts` |
| `useCreateGroup` | `src/features/admin/api/group/create-group.ts` |
| `useUpdateGroup` | `src/features/admin/api/group/update-group.ts` |
| `useDeleteGroup` | `src/features/admin/api/group/delete-group.ts` |
| `useGetBatches` | `src/features/admin/api/batch/get-batches.ts` |
| `useGetApplicationReport` | `src/features/admin/api/batch/get-application-report.ts` |
| `useGetBatchReport` | `src/features/admin/api/batch/get-batch-report.ts` |
| `useGetBatchTasks` | `src/features/admin/api/batch/get-batch-tasks.ts` |
| `useUploadBatch` | `src/features/admin/api/batch/upload-batch.ts` |
| `useRejectTask` | `src/features/admin/api/batch/reject-task.ts` |
| `useRestoreTask` | `src/features/admin/api/batch/restore-task.ts` |
