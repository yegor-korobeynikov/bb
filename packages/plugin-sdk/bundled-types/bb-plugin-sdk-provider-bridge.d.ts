// Portable type declarations for `@get-bb/plugin-sdk`. Unpublished BB
// workspace contracts are flattened; public subpaths may reuse the
// package root without requiring any other @bb/* package.
//
// Confused by the API, or need a symbol that isn't here? Clone the BB repo
// and read the real source: https://github.com/get-bb/bb

import { z } from 'zod';

declare const acpReasoningCliSchema: z.ZodObject<{
    defaultLevel: z.ZodOptional<z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }>>;
    flag: z.ZodString;
    levelValues: z.ZodOptional<z.ZodRecord<z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }> & z.core.$partial, z.ZodString>>;
    supportedLevels: z.ZodArray<z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }>>;
}, z.core.$strict>;
declare const acpNativeReasoningSchema: z.ZodObject<{
    configId: z.ZodString;
    defaultLevel: z.ZodOptional<z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }>>;
    levelValues: z.ZodOptional<z.ZodRecord<z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }> & z.core.$partial, z.ZodString>>;
    supportedLevels: z.ZodArray<z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }>>;
}, z.core.$strict>;
declare const acpPermissionCliSchema: z.ZodObject<{
    full: z.ZodOptional<z.ZodArray<z.ZodString>>;
    insertAfterArgs: z.ZodOptional<z.ZodNumber>;
    readonly: z.ZodOptional<z.ZodArray<z.ZodString>>;
    workspaceWrite: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;

interface JsonObject {
    [key: string]: JsonValue;
}
type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
declare const jsonValueSchema: z.ZodType<JsonValue>;

/**
 * Raw SDK task-type discriminants for the background tasks bb materializes as
 * timeline rows: dynamic workflows (the Workflow tool), backgrounded shell
 * commands (Bash with run_in_background), and backgrounded subagents. They
 * share the provider task event family (task_started / task_progress /
 * task_updated / task_notification). Other task types such as monitors share
 * the family too but are not materialized.
 */
declare const LOCAL_WORKFLOW_TASK_TYPE = "local_workflow";
declare const LOCAL_BASH_TASK_TYPE = "local_bash";
declare function isBackgroundAgentTaskType(taskType: string): boolean;
declare const backgroundTaskStatusSchema: z.ZodEnum<{
    completed: "completed";
    failed: "failed";
    killed: "killed";
    paused: "paused";
    pending: "pending";
    running: "running";
    stopped: "stopped";
}>;
type BackgroundTaskStatus = z.infer<typeof backgroundTaskStatusSchema>;
declare const workflowAgentStateSchema: z.ZodEnum<{
    done: "done";
    failed: "failed";
    queued: "queued";
    running: "running";
    skipped: "skipped";
}>;
type WorkflowAgentState = z.infer<typeof workflowAgentStateSchema>;
declare const workflowAgentSnapshotSchema: z.ZodObject<{
    agentType: z.ZodOptional<z.ZodString>;
    attempt: z.ZodNumber;
    cached: z.ZodBoolean;
    durationMs: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    index: z.ZodNumber;
    isolation: z.ZodOptional<z.ZodString>;
    label: z.ZodString;
    lastProgressAt: z.ZodNumber;
    lastToolName: z.ZodOptional<z.ZodString>;
    lastToolSummary: z.ZodOptional<z.ZodString>;
    model: z.ZodString;
    phaseIndex: z.ZodOptional<z.ZodNumber>;
    phaseTitle: z.ZodOptional<z.ZodString>;
    promptPreview: z.ZodOptional<z.ZodString>;
    queuedAt: z.ZodOptional<z.ZodNumber>;
    resultPreview: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodOptional<z.ZodNumber>;
    state: z.ZodEnum<{
        done: "done";
        failed: "failed";
        queued: "queued";
        running: "running";
        skipped: "skipped";
    }>;
    tokens: z.ZodOptional<z.ZodNumber>;
    toolCalls: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type WorkflowAgentSnapshot = z.infer<typeof workflowAgentSnapshotSchema>;
declare const workflowPhaseSnapshotSchema: z.ZodObject<{
    index: z.ZodNumber;
    kind: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
}, z.core.$strip>;
type WorkflowPhaseSnapshot = z.infer<typeof workflowPhaseSnapshotSchema>;
/**
 * Full merged workflow state at a point in time. Providers emit progress as
 * delta batches; the adapter folds them by (record type, index) so every
 * persisted snapshot supersedes the previous one.
 */
declare const workflowProgressSnapshotSchema: z.ZodObject<{
    agents: z.ZodArray<z.ZodObject<{
        agentType: z.ZodOptional<z.ZodString>;
        attempt: z.ZodNumber;
        cached: z.ZodBoolean;
        durationMs: z.ZodOptional<z.ZodNumber>;
        error: z.ZodOptional<z.ZodString>;
        index: z.ZodNumber;
        isolation: z.ZodOptional<z.ZodString>;
        label: z.ZodString;
        lastProgressAt: z.ZodNumber;
        lastToolName: z.ZodOptional<z.ZodString>;
        lastToolSummary: z.ZodOptional<z.ZodString>;
        model: z.ZodString;
        phaseIndex: z.ZodOptional<z.ZodNumber>;
        phaseTitle: z.ZodOptional<z.ZodString>;
        promptPreview: z.ZodOptional<z.ZodString>;
        queuedAt: z.ZodOptional<z.ZodNumber>;
        resultPreview: z.ZodOptional<z.ZodString>;
        startedAt: z.ZodOptional<z.ZodNumber>;
        state: z.ZodEnum<{
            done: "done";
            failed: "failed";
            queued: "queued";
            running: "running";
            skipped: "skipped";
        }>;
        tokens: z.ZodOptional<z.ZodNumber>;
        toolCalls: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    phases: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        kind: z.ZodOptional<z.ZodString>;
        title: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
type WorkflowProgressSnapshot = z.infer<typeof workflowProgressSnapshotSchema>;
declare const backgroundTaskUsageSchema: z.ZodObject<{
    durationMs: z.ZodNumber;
    toolUses: z.ZodNumber;
    totalTokens: z.ZodNumber;
}, z.core.$strip>;
type BackgroundTaskUsage = z.infer<typeof backgroundTaskUsageSchema>;
/**
 * Canonical derivation from the provider-reported task status to the shared
 * item-status machinery: paused stays pending because a paused workflow is
 * resumable; stopped maps to interrupted (user/system stop, not a failure).
 */
declare function backgroundTaskItemStatus(taskStatus: BackgroundTaskStatus): "completed" | "failed" | "interrupted" | "pending";
/**
 * Whether the provider-reported status already describes a finished task.
 * Settle backstops (thread restart, daemon crash, lease expiry) must preserve
 * these statuses instead of rewriting them to "stopped": a workflow whose
 * completion patch arrived before its terminal notification is completed, not
 * interrupted.
 */
declare function isSettledBackgroundTaskStatus(taskStatus: BackgroundTaskStatus): boolean;

declare const claudeTaskToolNameSchema: z.ZodEnum<{
    TaskCreate: "TaskCreate";
    TaskGet: "TaskGet";
    TaskList: "TaskList";
    TaskUpdate: "TaskUpdate";
}>;
declare const claudeTaskToolOutputSchema: z.ZodUnion<readonly [z.ZodObject<{
    task: z.ZodObject<{
        id: z.ZodString;
        subject: z.ZodString;
    }, z.core.$loose>;
}, z.core.$loose>, z.ZodObject<{
    task: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        status: z.ZodEnum<{
            completed: "completed";
            in_progress: "in_progress";
            pending: "pending";
        }>;
        subject: z.ZodString;
    }, z.core.$loose>>;
}, z.core.$loose>, z.ZodObject<{
    tasks: z.ZodArray<z.ZodUnknown>;
}, z.core.$loose>, z.ZodObject<{
    success: z.ZodBoolean;
    taskId: z.ZodString;
}, z.core.$loose>]>;
type ClaudeTaskToolOutput = z.infer<typeof claudeTaskToolOutputSchema>;

declare function toPositiveNumber(value: unknown): number | undefined;

declare const pendingInteractionCommandActionSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    command: z.ZodString;
    name: z.ZodString;
    path: z.ZodString;
    type: z.ZodLiteral<"read">;
}, z.core.$strip>, z.ZodObject<{
    command: z.ZodString;
    path: z.ZodNullable<z.ZodString>;
    type: z.ZodLiteral<"listFiles">;
}, z.core.$strip>, z.ZodObject<{
    command: z.ZodString;
    path: z.ZodNullable<z.ZodString>;
    query: z.ZodNullable<z.ZodString>;
    type: z.ZodLiteral<"search">;
}, z.core.$strip>, z.ZodObject<{
    command: z.ZodString;
    type: z.ZodLiteral<"unknown">;
}, z.core.$strip>], "type">;
type PendingInteractionCommandAction = z.infer<typeof pendingInteractionCommandActionSchema>;
declare const pendingInteractionNetworkPermissionsSchema: z.ZodObject<{
    enabled: z.ZodNullable<z.ZodBoolean>;
}, z.core.$strip>;
declare const pendingInteractionFileSystemPermissionsSchema: z.ZodObject<{
    read: z.ZodArray<z.ZodString>;
    write: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
declare const pendingInteractionMacOsPermissionsSchema: z.ZodObject<{
    accessibility: z.ZodBoolean;
    automations: z.ZodUnion<readonly [z.ZodLiteral<"none">, z.ZodLiteral<"all">, z.ZodObject<{
        bundleIds: z.ZodArray<z.ZodString>;
        kind: z.ZodLiteral<"bundle_ids">;
    }, z.core.$strip>]>;
    calendar: z.ZodBoolean;
    contacts: z.ZodEnum<{
        none: "none";
        read_only: "read_only";
        read_write: "read_write";
    }>;
    launchServices: z.ZodBoolean;
    preferences: z.ZodEnum<{
        none: "none";
        read_only: "read_only";
        read_write: "read_write";
    }>;
    reminders: z.ZodBoolean;
}, z.core.$strip>;
declare const pendingInteractionRequestedPermissionProfileSchema: z.ZodObject<{
    fileSystem: z.ZodNullable<z.ZodObject<{
        read: z.ZodArray<z.ZodString>;
        write: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    macos: z.ZodNullable<z.ZodObject<{
        accessibility: z.ZodBoolean;
        automations: z.ZodUnion<readonly [z.ZodLiteral<"none">, z.ZodLiteral<"all">, z.ZodObject<{
            bundleIds: z.ZodArray<z.ZodString>;
            kind: z.ZodLiteral<"bundle_ids">;
        }, z.core.$strip>]>;
        calendar: z.ZodBoolean;
        contacts: z.ZodEnum<{
            none: "none";
            read_only: "read_only";
            read_write: "read_write";
        }>;
        launchServices: z.ZodBoolean;
        preferences: z.ZodEnum<{
            none: "none";
            read_only: "read_only";
            read_write: "read_write";
        }>;
        reminders: z.ZodBoolean;
    }, z.core.$strip>>;
    network: z.ZodNullable<z.ZodObject<{
        enabled: z.ZodNullable<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type PendingInteractionRequestedPermissionProfile = z.infer<typeof pendingInteractionRequestedPermissionProfileSchema>;
declare const pendingInteractionGrantablePermissionProfileSchema: z.ZodObject<{
    fileSystem: z.ZodNullable<z.ZodObject<{
        read: z.ZodArray<z.ZodString>;
        write: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    network: z.ZodNullable<z.ZodObject<{
        enabled: z.ZodNullable<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strict>;
type PendingInteractionGrantablePermissionProfile = z.infer<typeof pendingInteractionGrantablePermissionProfileSchema>;
declare const pendingInteractionGrantedPermissionProfileSchema: z.ZodObject<{
    fileSystem: z.ZodNullable<z.ZodObject<{
        read: z.ZodArray<z.ZodString>;
        write: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    network: z.ZodNullable<z.ZodObject<{
        enabled: z.ZodNullable<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strict>;
type PendingInteractionGrantedPermissionProfile = z.infer<typeof pendingInteractionGrantedPermissionProfileSchema>;
declare const pendingInteractionApprovalDecisionSchema: z.ZodEnum<{
    allow_for_session: "allow_for_session";
    allow_once: "allow_once";
    deny: "deny";
}>;
type PendingInteractionApprovalDecision = z.infer<typeof pendingInteractionApprovalDecisionSchema>;
declare const pendingInteractionApprovalSubjectSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    actions: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        command: z.ZodString;
        name: z.ZodString;
        path: z.ZodString;
        type: z.ZodLiteral<"read">;
    }, z.core.$strip>, z.ZodObject<{
        command: z.ZodString;
        path: z.ZodNullable<z.ZodString>;
        type: z.ZodLiteral<"listFiles">;
    }, z.core.$strip>, z.ZodObject<{
        command: z.ZodString;
        path: z.ZodNullable<z.ZodString>;
        query: z.ZodNullable<z.ZodString>;
        type: z.ZodLiteral<"search">;
    }, z.core.$strip>, z.ZodObject<{
        command: z.ZodString;
        type: z.ZodLiteral<"unknown">;
    }, z.core.$strip>], "type">>;
    command: z.ZodString;
    cwd: z.ZodNullable<z.ZodString>;
    itemId: z.ZodString;
    kind: z.ZodLiteral<"command">;
    sessionGrant: z.ZodNullable<z.ZodObject<{
        fileSystem: z.ZodNullable<z.ZodObject<{
            read: z.ZodArray<z.ZodString>;
            write: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        network: z.ZodNullable<z.ZodObject<{
            enabled: z.ZodNullable<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strict>>;
}, z.core.$strip>, z.ZodObject<{
    itemId: z.ZodString;
    kind: z.ZodLiteral<"file_change">;
    sessionGrant: z.ZodNullable<z.ZodObject<{
        fileSystem: z.ZodNullable<z.ZodObject<{
            read: z.ZodArray<z.ZodString>;
            write: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        network: z.ZodNullable<z.ZodObject<{
            enabled: z.ZodNullable<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strict>>;
    writeScope: z.ZodNullable<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    itemId: z.ZodString;
    kind: z.ZodLiteral<"permission_grant">;
    permissions: z.ZodObject<{
        fileSystem: z.ZodNullable<z.ZodObject<{
            read: z.ZodArray<z.ZodString>;
            write: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        network: z.ZodNullable<z.ZodObject<{
            enabled: z.ZodNullable<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strict>;
    toolName: z.ZodNullable<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    itemId: z.ZodString;
    kind: z.ZodLiteral<"plan">;
    plan: z.ZodString;
    planFilePath: z.ZodNullable<z.ZodString>;
}, z.core.$strip>], "kind">;
type PendingInteractionApprovalSubject = z.infer<typeof pendingInteractionApprovalSubjectSchema>;
declare const approvalPendingInteractionPayloadSchema: z.ZodObject<{
    availableDecisions: z.ZodArray<z.ZodEnum<{
        allow_for_session: "allow_for_session";
        allow_once: "allow_once";
        deny: "deny";
    }>>;
    kind: z.ZodLiteral<"approval">;
    reason: z.ZodNullable<z.ZodString>;
    subject: z.ZodDiscriminatedUnion<[z.ZodObject<{
        actions: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            command: z.ZodString;
            name: z.ZodString;
            path: z.ZodString;
            type: z.ZodLiteral<"read">;
        }, z.core.$strip>, z.ZodObject<{
            command: z.ZodString;
            path: z.ZodNullable<z.ZodString>;
            type: z.ZodLiteral<"listFiles">;
        }, z.core.$strip>, z.ZodObject<{
            command: z.ZodString;
            path: z.ZodNullable<z.ZodString>;
            query: z.ZodNullable<z.ZodString>;
            type: z.ZodLiteral<"search">;
        }, z.core.$strip>, z.ZodObject<{
            command: z.ZodString;
            type: z.ZodLiteral<"unknown">;
        }, z.core.$strip>], "type">>;
        command: z.ZodString;
        cwd: z.ZodNullable<z.ZodString>;
        itemId: z.ZodString;
        kind: z.ZodLiteral<"command">;
        sessionGrant: z.ZodNullable<z.ZodObject<{
            fileSystem: z.ZodNullable<z.ZodObject<{
                read: z.ZodArray<z.ZodString>;
                write: z.ZodArray<z.ZodString>;
            }, z.core.$strip>>;
            network: z.ZodNullable<z.ZodObject<{
                enabled: z.ZodNullable<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strict>>;
    }, z.core.$strip>, z.ZodObject<{
        itemId: z.ZodString;
        kind: z.ZodLiteral<"file_change">;
        sessionGrant: z.ZodNullable<z.ZodObject<{
            fileSystem: z.ZodNullable<z.ZodObject<{
                read: z.ZodArray<z.ZodString>;
                write: z.ZodArray<z.ZodString>;
            }, z.core.$strip>>;
            network: z.ZodNullable<z.ZodObject<{
                enabled: z.ZodNullable<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strict>>;
        writeScope: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        itemId: z.ZodString;
        kind: z.ZodLiteral<"permission_grant">;
        permissions: z.ZodObject<{
            fileSystem: z.ZodNullable<z.ZodObject<{
                read: z.ZodArray<z.ZodString>;
                write: z.ZodArray<z.ZodString>;
            }, z.core.$strip>>;
            network: z.ZodNullable<z.ZodObject<{
                enabled: z.ZodNullable<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strict>;
        toolName: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        itemId: z.ZodString;
        kind: z.ZodLiteral<"plan">;
        plan: z.ZodString;
        planFilePath: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>], "kind">;
}, z.core.$strip>;
type ApprovalPendingInteractionPayload = z.infer<typeof approvalPendingInteractionPayloadSchema>;
declare const USER_QUESTION_MAX_QUESTIONS = 4;
declare const USER_QUESTION_MAX_OPTIONS = 4;
declare const pendingInteractionUserQuestionQuestionSchema: z.ZodObject<{
    allowFreeText: z.ZodBoolean;
    id: z.ZodString;
    multiSelect: z.ZodBoolean;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodOptional<z.ZodString>;
        label: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>>;
    prompt: z.ZodString;
    shortLabel: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type PendingInteractionUserQuestionQuestion = z.infer<typeof pendingInteractionUserQuestionQuestionSchema>;
declare const userQuestionPendingInteractionPayloadSchema: z.ZodObject<{
    kind: z.ZodLiteral<"user_question">;
    questions: z.ZodArray<z.ZodObject<{
        allowFreeText: z.ZodBoolean;
        id: z.ZodString;
        multiSelect: z.ZodBoolean;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            description: z.ZodOptional<z.ZodString>;
            label: z.ZodString;
            value: z.ZodString;
        }, z.core.$strip>>>;
        prompt: z.ZodString;
        shortLabel: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type UserQuestionPendingInteractionPayload = z.infer<typeof userQuestionPendingInteractionPayloadSchema>;
declare const pluginPendingInteractionPayloadSchema: z.ZodObject<{
    data: z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>;
    kind: z.ZodLiteral<"plugin">;
    title: z.ZodString;
}, z.core.$strip>;
type PluginPendingInteractionPayload = z.infer<typeof pluginPendingInteractionPayloadSchema>;
declare const pendingInteractionPayloadSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    availableDecisions: z.ZodArray<z.ZodEnum<{
        allow_for_session: "allow_for_session";
        allow_once: "allow_once";
        deny: "deny";
    }>>;
    kind: z.ZodLiteral<"approval">;
    reason: z.ZodNullable<z.ZodString>;
    subject: z.ZodDiscriminatedUnion<[z.ZodObject<{
        actions: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
            command: z.ZodString;
            name: z.ZodString;
            path: z.ZodString;
            type: z.ZodLiteral<"read">;
        }, z.core.$strip>, z.ZodObject<{
            command: z.ZodString;
            path: z.ZodNullable<z.ZodString>;
            type: z.ZodLiteral<"listFiles">;
        }, z.core.$strip>, z.ZodObject<{
            command: z.ZodString;
            path: z.ZodNullable<z.ZodString>;
            query: z.ZodNullable<z.ZodString>;
            type: z.ZodLiteral<"search">;
        }, z.core.$strip>, z.ZodObject<{
            command: z.ZodString;
            type: z.ZodLiteral<"unknown">;
        }, z.core.$strip>], "type">>;
        command: z.ZodString;
        cwd: z.ZodNullable<z.ZodString>;
        itemId: z.ZodString;
        kind: z.ZodLiteral<"command">;
        sessionGrant: z.ZodNullable<z.ZodObject<{
            fileSystem: z.ZodNullable<z.ZodObject<{
                read: z.ZodArray<z.ZodString>;
                write: z.ZodArray<z.ZodString>;
            }, z.core.$strip>>;
            network: z.ZodNullable<z.ZodObject<{
                enabled: z.ZodNullable<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strict>>;
    }, z.core.$strip>, z.ZodObject<{
        itemId: z.ZodString;
        kind: z.ZodLiteral<"file_change">;
        sessionGrant: z.ZodNullable<z.ZodObject<{
            fileSystem: z.ZodNullable<z.ZodObject<{
                read: z.ZodArray<z.ZodString>;
                write: z.ZodArray<z.ZodString>;
            }, z.core.$strip>>;
            network: z.ZodNullable<z.ZodObject<{
                enabled: z.ZodNullable<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strict>>;
        writeScope: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        itemId: z.ZodString;
        kind: z.ZodLiteral<"permission_grant">;
        permissions: z.ZodObject<{
            fileSystem: z.ZodNullable<z.ZodObject<{
                read: z.ZodArray<z.ZodString>;
                write: z.ZodArray<z.ZodString>;
            }, z.core.$strip>>;
            network: z.ZodNullable<z.ZodObject<{
                enabled: z.ZodNullable<z.ZodBoolean>;
            }, z.core.$strip>>;
        }, z.core.$strict>;
        toolName: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        itemId: z.ZodString;
        kind: z.ZodLiteral<"plan">;
        plan: z.ZodString;
        planFilePath: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>], "kind">;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"user_question">;
    questions: z.ZodArray<z.ZodObject<{
        allowFreeText: z.ZodBoolean;
        id: z.ZodString;
        multiSelect: z.ZodBoolean;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            description: z.ZodOptional<z.ZodString>;
            label: z.ZodString;
            value: z.ZodString;
        }, z.core.$strip>>>;
        prompt: z.ZodString;
        shortLabel: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>], "kind">;
type PendingInteractionPayload = z.infer<typeof pendingInteractionPayloadSchema>;
type AnyPendingInteractionPayload = PendingInteractionPayload | PluginPendingInteractionPayload;
declare function isApprovalPendingInteractionPayload(payload: AnyPendingInteractionPayload): payload is ApprovalPendingInteractionPayload;
declare function isUserQuestionPendingInteractionPayload(payload: AnyPendingInteractionPayload): payload is UserQuestionPendingInteractionPayload;
declare const approvalPendingInteractionResolutionSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    decision: z.ZodLiteral<"allow_once">;
    grantedPermissions: z.ZodNullable<z.ZodObject<{
        fileSystem: z.ZodNullable<z.ZodObject<{
            read: z.ZodArray<z.ZodString>;
            write: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        network: z.ZodNullable<z.ZodObject<{
            enabled: z.ZodNullable<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strict>>;
}, z.core.$strip>, z.ZodObject<{
    decision: z.ZodLiteral<"allow_for_session">;
    grantedPermissions: z.ZodNullable<z.ZodObject<{
        fileSystem: z.ZodNullable<z.ZodObject<{
            read: z.ZodArray<z.ZodString>;
            write: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        network: z.ZodNullable<z.ZodObject<{
            enabled: z.ZodNullable<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strict>>;
}, z.core.$strip>, z.ZodObject<{
    decision: z.ZodLiteral<"deny">;
}, z.core.$strip>], "decision">;
type ApprovalPendingInteractionResolution = z.infer<typeof approvalPendingInteractionResolutionSchema>;
declare const userQuestionPendingInteractionResolutionSchema: z.ZodObject<{
    answers: z.ZodRecord<z.ZodString, z.ZodObject<{
        freeText: z.ZodOptional<z.ZodString>;
        selected: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    kind: z.ZodLiteral<"user_answer">;
}, z.core.$strip>;
type UserQuestionPendingInteractionResolution = z.infer<typeof userQuestionPendingInteractionResolutionSchema>;
declare const pendingInteractionResolutionSchema: z.ZodUnion<readonly [z.ZodDiscriminatedUnion<[z.ZodObject<{
    decision: z.ZodLiteral<"allow_once">;
    grantedPermissions: z.ZodNullable<z.ZodObject<{
        fileSystem: z.ZodNullable<z.ZodObject<{
            read: z.ZodArray<z.ZodString>;
            write: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        network: z.ZodNullable<z.ZodObject<{
            enabled: z.ZodNullable<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strict>>;
}, z.core.$strip>, z.ZodObject<{
    decision: z.ZodLiteral<"allow_for_session">;
    grantedPermissions: z.ZodNullable<z.ZodObject<{
        fileSystem: z.ZodNullable<z.ZodObject<{
            read: z.ZodArray<z.ZodString>;
            write: z.ZodArray<z.ZodString>;
        }, z.core.$strip>>;
        network: z.ZodNullable<z.ZodObject<{
            enabled: z.ZodNullable<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strict>>;
}, z.core.$strip>, z.ZodObject<{
    decision: z.ZodLiteral<"deny">;
}, z.core.$strip>], "decision">, z.ZodObject<{
    answers: z.ZodRecord<z.ZodString, z.ZodObject<{
        freeText: z.ZodOptional<z.ZodString>;
        selected: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    kind: z.ZodLiteral<"user_answer">;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"plugin_submitted">;
}, z.core.$strip>]>;
type PendingInteractionResolution = z.infer<typeof pendingInteractionResolutionSchema>;
declare function isApprovalPendingInteractionResolution(resolution: PendingInteractionResolution): resolution is ApprovalPendingInteractionResolution;
declare function isUserQuestionPendingInteractionResolution(resolution: PendingInteractionResolution): resolution is UserQuestionPendingInteractionResolution;

/**
 * Order is load-bearing: `reasoningRank` (index) drives model-switch
 * reconciliation. "none" (no extended thinking) sits at the bottom — only
 * providers that expose a thinking-off variant list it (currently Cursor and
 * Pi models whose `thinkingLevelMap` advertises `off`).
 * "ultracode" sits between "xhigh" and "max" because its underlying effort IS
 * xhigh (plus standing workflow orchestration) — a model without ultracode
 * support should reconcile down to xhigh, not up to max.
 * "ultra" is a Codex-native top tier (max effort plus automatic task
 * delegation) exposed only by some models; it ranks above "max".
 */
declare const reasoningLevelValues: readonly ["none", "low", "medium", "high", "xhigh", "ultracode", "max", "ultra"];
declare const reasoningLevelSchema: z.ZodEnum<{
    high: "high";
    low: "low";
    max: "max";
    medium: "medium";
    none: "none";
    ultra: "ultra";
    ultracode: "ultracode";
    xhigh: "xhigh";
}>;
type ReasoningLevel = z.infer<typeof reasoningLevelSchema>;
declare const serviceTierSchema: z.ZodEnum<{
    default: "default";
    fast: "fast";
}>;
type ServiceTier = z.infer<typeof serviceTierSchema>;
/**
 * Controls how a provider should incorporate server-owned instructions into its
 * system prompt.
 *
 * - `append`: keep the provider's preset system prompt and append instructions.
 * - `replace`: use the provided instructions as the full system prompt.
 */
declare const instructionModeValues: readonly ["append", "replace"];
declare const instructionModeSchema: z.ZodEnum<{
    append: "append";
    replace: "replace";
}>;
type InstructionMode = z.infer<typeof instructionModeSchema>;
declare const permissionModeSchema: z.ZodEnum<{
    "accept-edits": "accept-edits";
    auto: "auto";
    full: "full";
}>;
type PermissionMode = z.infer<typeof permissionModeSchema>;
declare const permissionEscalationValues: readonly ["ask", "deny"];
declare const permissionEscalationSchema: z.ZodEnum<{
    ask: "ask";
    deny: "deny";
}>;
type PermissionEscalation = z.infer<typeof permissionEscalationSchema>;
declare const DEFAULT_CLAUDE_CODE_MOCK_CLI_TRAFFIC_ENDPOINT = "https://api.anthropic.com";
declare function isClaudeCodeMockCliTrafficEndpoint(value: string): boolean;
declare const claudeCodeMockCliTrafficConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    endpoint: z.ZodString;
}, z.core.$strict>;
type ClaudeCodeMockCliTrafficConfig = z.infer<typeof claudeCodeMockCliTrafficConfigSchema>;
declare const DEFAULT_CLAUDE_CODE_MOCK_CLI_TRAFFIC_CONFIG: ClaudeCodeMockCliTrafficConfig;
declare const promptMentionCommandTriggerSchema: z.ZodEnum<{
    "/": "/";
}>;
type PromptMentionCommandTrigger = z.infer<typeof promptMentionCommandTriggerSchema>;
declare const promptInputSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    mentions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        end: z.ZodNumber;
        resource: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDiscriminatedUnion<[z.ZodObject<{
            kind: z.ZodLiteral<"thread">;
            label: z.ZodString;
            projectId: z.ZodOptional<z.ZodString>;
            threadId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"project">;
            label: z.ZodString;
            projectId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            kind: z.ZodLiteral<"section">;
            label: z.ZodString;
            sectionId: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            entryKind: z.ZodEnum<{
                directory: "directory";
                file: "file";
            }>;
            kind: z.ZodLiteral<"path">;
            label: z.ZodString;
            path: z.ZodString;
            source: z.ZodEnum<{
                "thread-storage": "thread-storage";
                workspace: "workspace";
            }>;
        }, z.core.$strip>, z.ZodObject<{
            argumentHint: z.ZodNullable<z.ZodString>;
            kind: z.ZodLiteral<"command">;
            label: z.ZodString;
            name: z.ZodString;
            origin: z.ZodEnum<{
                builtin: "builtin";
                project: "project";
                user: "user";
            }>;
            source: z.ZodEnum<{
                command: "command";
                skill: "skill";
            }>;
            trigger: z.ZodEnum<{
                "/": "/";
            }>;
        }, z.core.$strip>, z.ZodObject<{
            icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            itemId: z.ZodString;
            kind: z.ZodLiteral<"plugin">;
            label: z.ZodString;
            pluginId: z.ZodString;
        }, z.core.$strip>], "kind">>;
        start: z.ZodNumber;
    }, z.core.$strip>>>;
    text: z.ZodString;
    type: z.ZodLiteral<"text">;
    visibility: z.ZodOptional<z.ZodEnum<{
        "agent-only": "agent-only";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"image">;
    url: z.ZodString;
    visibility: z.ZodOptional<z.ZodEnum<{
        "agent-only": "agent-only";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    path: z.ZodString;
    type: z.ZodLiteral<"localImage">;
    visibility: z.ZodOptional<z.ZodEnum<{
        "agent-only": "agent-only";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    mimeType: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    sizeBytes: z.ZodOptional<z.ZodNumber>;
    type: z.ZodLiteral<"localFile">;
    visibility: z.ZodOptional<z.ZodEnum<{
        "agent-only": "agent-only";
    }>>;
}, z.core.$strip>], "type">;
type PromptInput = z.infer<typeof promptInputSchema>;
interface PromptCommandSelector {
    trigger: PromptMentionCommandTrigger;
    name: string;
}
/**
 * Whether input consists solely of one selected built-in `/compact` mention.
 * Raw matching text and project/user commands intentionally do not qualify.
 */
declare function isStandaloneBuiltinCompactCommand(input: readonly PromptInput[]): boolean;
declare function removeCommandMentionsFromPromptInput(input: readonly PromptInput[], selector: PromptCommandSelector): PromptInput[];
declare const runtimePermissionScopeValues: readonly ["workspace", "full"];
declare const runtimePermissionScopeSchema: z.ZodEnum<{
    full: "full";
    workspace: "workspace";
}>;
type RuntimePermissionScope = z.infer<typeof runtimePermissionScopeSchema>;
declare const runtimePermissionPolicySchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    approvalReviewer: z.ZodLiteral<"user">;
    permissionEscalation: z.ZodEnum<{
        ask: "ask";
        deny: "deny";
    }>;
    permissionMode: z.ZodLiteral<"accept-edits">;
    permissionScope: z.ZodLiteral<"workspace">;
}, z.core.$strip>, z.ZodObject<{
    approvalReviewer: z.ZodLiteral<"automatic">;
    permissionEscalation: z.ZodEnum<{
        ask: "ask";
        deny: "deny";
    }>;
    permissionMode: z.ZodLiteral<"auto">;
    permissionScope: z.ZodLiteral<"workspace">;
}, z.core.$strip>, z.ZodObject<{
    approvalReviewer: z.ZodNull;
    permissionEscalation: z.ZodNull;
    permissionMode: z.ZodLiteral<"full">;
    permissionScope: z.ZodLiteral<"full">;
}, z.core.$strip>], "permissionMode">;
type RuntimePermissionPolicy = z.infer<typeof runtimePermissionPolicySchema>;

declare const clientTurnRequestIdSchema: z.ZodString;
type ClientTurnRequestId = z.infer<typeof clientTurnRequestIdSchema>;

declare const threadEventItemStatusSchema: z.ZodEnum<{
    completed: "completed";
    failed: "failed";
    interrupted: "interrupted";
    pending: "pending";
}>;
type ThreadEventItemStatus = z.infer<typeof threadEventItemStatusSchema>;
declare const threadEventTurnStatusSchema: z.ZodEnum<{
    completed: "completed";
    failed: "failed";
    interrupted: "interrupted";
}>;
type ThreadEventTurnStatus = z.infer<typeof threadEventTurnStatusSchema>;
declare const providerErrorCategorySchema: z.ZodEnum<{
    "active-turn-not-steerable": "active-turn-not-steerable";
    "bad-request": "bad-request";
    "budget-exceeded": "budget-exceeded";
    "connection-failed": "connection-failed";
    "context-window-exceeded": "context-window-exceeded";
    "max-output-tokens": "max-output-tokens";
    "max-turns": "max-turns";
    "rate-limit": "rate-limit";
    "stream-disconnected": "stream-disconnected";
    "structured-output-retries": "structured-output-retries";
    "thread-rollback-failed": "thread-rollback-failed";
    "too-many-failed-attempts": "too-many-failed-attempts";
    billing: "billing";
    internal: "internal";
    overloaded: "overloaded";
    policy: "policy";
    sandbox: "sandbox";
    unauthorized: "unauthorized";
    unknown: "unknown";
}>;
type ProviderErrorCategory = z.infer<typeof providerErrorCategorySchema>;
declare const providerErrorInfoSchema: z.ZodObject<{
    category: z.ZodEnum<{
        "active-turn-not-steerable": "active-turn-not-steerable";
        "bad-request": "bad-request";
        "budget-exceeded": "budget-exceeded";
        "connection-failed": "connection-failed";
        "context-window-exceeded": "context-window-exceeded";
        "max-output-tokens": "max-output-tokens";
        "max-turns": "max-turns";
        "rate-limit": "rate-limit";
        "stream-disconnected": "stream-disconnected";
        "structured-output-retries": "structured-output-retries";
        "thread-rollback-failed": "thread-rollback-failed";
        "too-many-failed-attempts": "too-many-failed-attempts";
        billing: "billing";
        internal: "internal";
        overloaded: "overloaded";
        policy: "policy";
        sandbox: "sandbox";
        unauthorized: "unauthorized";
        unknown: "unknown";
    }>;
    httpStatusCode: z.ZodNullable<z.ZodNumber>;
    providerCode: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
type ProviderErrorInfo = z.infer<typeof providerErrorInfoSchema>;
declare const providerRateLimitStatusSchema: z.ZodEnum<{
    allowed: "allowed";
    blocked: "blocked";
    unknown: "unknown";
    warning: "warning";
}>;
type ProviderRateLimitStatus = z.infer<typeof providerRateLimitStatusSchema>;
declare const providerRateLimitWindowSchema: z.ZodObject<{
    label: z.ZodNullable<z.ZodString>;
    providerKey: z.ZodNullable<z.ZodString>;
    resetsAtMs: z.ZodNullable<z.ZodNumber>;
    status: z.ZodEnum<{
        allowed: "allowed";
        blocked: "blocked";
        unknown: "unknown";
        warning: "warning";
    }>;
}, z.core.$strip>;
type ProviderRateLimitWindow = z.infer<typeof providerRateLimitWindowSchema>;
declare const providerRateLimitStateSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        "spend-control": "spend-control";
        "subscription-window": "subscription-window";
        credits: "credits";
        unknown: "unknown";
    }>;
    overageReason: z.ZodNullable<z.ZodString>;
    overageStatus: z.ZodNullable<z.ZodEnum<{
        allowed: "allowed";
        rejected: "rejected";
        unavailable: "unavailable";
        warning: "warning";
    }>>;
    providerId: z.ZodString;
    reachedReason: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<{
        allowed: "allowed";
        blocked: "blocked";
        unknown: "unknown";
        warning: "warning";
    }>;
    windows: z.ZodArray<z.ZodObject<{
        label: z.ZodNullable<z.ZodString>;
        providerKey: z.ZodNullable<z.ZodString>;
        resetsAtMs: z.ZodNullable<z.ZodNumber>;
        status: z.ZodEnum<{
            allowed: "allowed";
            blocked: "blocked";
            unknown: "unknown";
            warning: "warning";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ProviderRateLimitState = z.infer<typeof providerRateLimitStateSchema>;
declare const threadEventPlanStepSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        completed: "completed";
        failed: "failed";
        pending: "pending";
    }>>;
    step: z.ZodString;
}, z.core.$strip>;
type ThreadEventPlanStep = z.infer<typeof threadEventPlanStepSchema>;
declare const threadEventUserContentSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    text: z.ZodString;
    type: z.ZodLiteral<"text">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"image">;
    url: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    path: z.ZodString;
    type: z.ZodLiteral<"localImage">;
}, z.core.$strip>, z.ZodObject<{
    path: z.ZodString;
    type: z.ZodLiteral<"localFile">;
}, z.core.$strip>], "type">;
type ThreadEventUserContent = z.infer<typeof threadEventUserContentSchema>;
declare const threadEventTokenUsageBreakdownSchema: z.ZodObject<{
    cachedInputTokens: z.ZodNumber;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    reasoningOutputTokens: z.ZodNumber;
    totalTokens: z.ZodNumber;
}, z.core.$strip>;
type ThreadEventTokenUsageBreakdown = z.infer<typeof threadEventTokenUsageBreakdownSchema>;
declare const threadEventContextWindowUsageSchema: z.ZodObject<{
    estimated: z.ZodBoolean;
    modelContextWindow: z.ZodNullable<z.ZodNumber>;
    usedTokens: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>;
type ThreadEventContextWindowUsage = z.infer<typeof threadEventContextWindowUsageSchema>;
declare const providerRawEventSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
    jsonrpc: z.ZodLiteral<"2.0">;
    method: z.ZodString;
    params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
}, z.core.$strip>;
type ProviderRawEvent = z.infer<typeof providerRawEventSchema>;

declare const modelReasoningEffortSchema: z.ZodObject<{
    description: z.ZodString;
    reasoningEffort: z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }>;
}, z.core.$strip>;
type ModelReasoningEffort = z.infer<typeof modelReasoningEffortSchema>;
declare const availableModelSchema: z.ZodObject<{
    defaultReasoningEffort: z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }>;
    description: z.ZodString;
    displayName: z.ZodString;
    id: z.ZodString;
    isDefault: z.ZodBoolean;
    model: z.ZodString;
    routeProviderId: z.ZodOptional<z.ZodString>;
    supportedReasoningEfforts: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        reasoningEffort: z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type AvailableModel = z.infer<typeof availableModelSchema>;
declare const dynamicToolSchema: z.ZodObject<{
    description: z.ZodString;
    inputSchema: z.ZodUnknown;
    name: z.ZodString;
}, z.core.$strip>;
type DynamicTool = z.infer<typeof dynamicToolSchema>;

declare const LOW_REASONING_EFFORT: ModelReasoningEffort;
declare const MEDIUM_REASONING_EFFORT: ModelReasoningEffort;
declare const HIGH_REASONING_EFFORT: ModelReasoningEffort;
declare const XHIGH_REASONING_EFFORT: ModelReasoningEffort;
declare const ULTRACODE_REASONING_EFFORT: ModelReasoningEffort;
declare const MAX_REASONING_EFFORT: ModelReasoningEffort;
declare function reasoningEffortsForLevels(levels: readonly ReasoningLevel[]): ModelReasoningEffort[];

/**
 * Shared adapter utilities.
 *
 * Functions and constants duplicated across the claude-code, pi, and codex
 * adapters are extracted here so each adapter imports from one place.
 */

declare function toOptionalString(value: unknown): string | undefined;
declare function toOptionalRecord(value: unknown): Record<string, unknown> | undefined;
/**
 * The environment overrides a bridge may hand its provider: the requested
 * variables minus any name a shell would refuse. A rejected name is dropped,
 * never passed through — a provider that inherits an unquotable name can fail
 * its whole session on one bad key.
 */
declare function buildShellEnvOverrides(envVars?: Record<string, string>): Record<string, string>;
declare function toNonNegativeNumber(value: unknown): number;
declare function normalizeProviderCommandOutput(args: {
    emptyPlaceholders: readonly string[];
    text: string;
}): string | undefined;
/**
 * Extracts text from tool result content.
 * Handles strings, arrays of text blocks, and `{ content: [...] }` wrappers.
 */
declare function extractResultText(content: unknown): string;

type BridgeJsonRpcId = string | number;
type BridgeJsonRpcResponse$1 = {
    jsonrpc: "2.0";
    id: BridgeJsonRpcId;
    result: unknown;
} | {
    jsonrpc: "2.0";
    id: BridgeJsonRpcId;
    error: {
        code: number;
        message: string;
    };
};
interface CreateBridgeIoArgs {
    write?: (line: string) => void;
}
declare function createBridgeIo<TMessage>({ write, }?: CreateBridgeIoArgs): {
    send: (message: TMessage | BridgeJsonRpcResponse$1) => void;
    sendError: (id: BridgeJsonRpcId, code: number, message: string) => void;
    sendResult: (id: BridgeJsonRpcId, result: unknown) => void;
};
declare function createBridgeLineHandler(args: {
    handleParsedMessage: (message: unknown) => void;
}): (line: string) => void;
declare function runBridgeRequest<TRequest extends {
    id: BridgeJsonRpcId;
}>(args: {
    handleRequest: (request: TRequest) => Promise<void>;
    request: TRequest;
    sendError: (id: BridgeJsonRpcId, code: number, message: string) => void;
}): void;

declare function withoutBridgeRuntimeEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv;

/**
 * Shared tool call helpers for bridge processes.
 *
 * Both claude-code and pi bridges forward tool calls from the provider SDK
 * to the host-daemon and feed responses back. This module provides:
 * - The JSON-RPC request type for forwarding tool calls
 * - Response decoding for tool call results from the host-daemon
 * - Generic JSON-RPC response decoding (for matching tool call responses)
 */

interface BridgeToolCallRequest {
    jsonrpc: "2.0";
    id: string | number;
    method: "item/tool/call";
    params: {
        providerThreadId: string;
        threadId?: string;
        turnId: string | null;
        callId: string;
        tool: string;
        arguments: Record<string, unknown>;
    };
}
declare const bridgeRequestEnvelopeSchema: z.ZodObject<{
    id: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    jsonrpc: z.ZodLiteral<"2.0">;
    method: z.ZodString;
    params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
declare const jsonRpcSuccessResponseSchema: z.ZodObject<{
    id: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    jsonrpc: z.ZodLiteral<"2.0">;
    result: z.ZodUnknown;
}, z.core.$strip>;
declare const jsonRpcErrorResponseSchema: z.ZodObject<{
    error: z.ZodObject<{
        code: z.ZodNumber;
        data: z.ZodOptional<z.ZodUnknown>;
        message: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    id: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
    jsonrpc: z.ZodLiteral<"2.0">;
}, z.core.$strip>;
type BridgeJsonRpcResponse = z.infer<typeof jsonRpcSuccessResponseSchema> | z.infer<typeof jsonRpcErrorResponseSchema>;
declare function decodeBridgeJsonRpcResponse(input: unknown): BridgeJsonRpcResponse | null;
declare function decodeToolCallResponsePayload(result: unknown): {
    content: string;
    isError: boolean;
};

/**
 * Structural contracts shared by the runtime's generic adapter and the bridge
 * implementations that translate a provider's native protocol.
 *
 * These are the shapes a bridge produces or consumes while it maps its
 * provider onto the canonical protocol. They live in the kit (rather than in
 * `@bb/agent-runtime`) so a bridge shipped from a plugin never depends on the
 * runtime package.
 */

interface ProviderRequestCommandPlan {
    kind: "request";
    method: string;
    params?: object;
}
interface ProviderPostInitializeRequest {
    plan: ProviderRequestCommandPlan;
    required: boolean;
    onResult(result: unknown): void;
}
interface DecodedInteractiveRequest {
    requestId: string | number;
    method: string;
    providerThreadId: string;
    /**
     * Non-empty BB turn id when known. Use null as the canonical unresolved
     * value so the runtime can resolve from the active turn; empty strings are
     * malformed adapter output.
     */
    turnId: string | null;
    payload: PendingInteractionPayload;
    threadId?: string;
}
interface PreparedProviderCommandDispatch {
    rollback(): void;
    /**
     * Claims the prepared correlation if no provider event has consumed it yet,
     * proving this dispatch still owns unstarted work. Returns true (and drops
     * the correlation, so nothing can consume it twice) when the provider never
     * started a turn for this dispatch; false once it did. Callers use it to
     * settle a prompt the provider accepted and finished without emitting any
     * turn activity, without fabricating a turn from a late signal.
     */
    claim(): boolean;
}
interface BuildInteractiveResponseArgs {
    request: DecodedInteractiveRequest;
    resolution: PendingInteractionResolution;
}

declare const jsonRpcEnvelopeSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    method: z.ZodString;
    params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$loose>;
declare const sdkMessageEnvelopeSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    method: z.ZodLiteral<"sdk/message">;
    params: z.ZodObject<{
        message: z.ZodUnknown;
        parent_tool_use_id: z.ZodOptional<z.ZodString>;
        threadId: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$loose>;
declare const threadIdentityEnvelopeSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    method: z.ZodLiteral<"thread/identity">;
    params: z.ZodObject<{
        providerThreadId: z.ZodOptional<z.ZodString>;
        threadId: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$loose>;
declare const threadContextWindowUsageEnvelopeSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    method: z.ZodLiteral<"thread/contextWindowUsage/updated">;
    params: z.ZodObject<{
        contextWindowUsage: z.ZodObject<{
            estimated: z.ZodBoolean;
            modelContextWindow: z.ZodNullable<z.ZodNumber>;
            usedTokens: z.ZodNullable<z.ZodNumber>;
        }, z.core.$strip>;
        threadId: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>;
}, z.core.$loose>;
declare const errorEnvelopeSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    method: z.ZodLiteral<"error">;
    params: z.ZodOptional<z.ZodObject<{
        message: z.ZodOptional<z.ZodString>;
    }, z.core.$loose>>;
}, z.core.$loose>;

declare function mimeTypeFromExtension(filePath: string): string;

interface BridgeToolCallResult {
    content: string;
    isError?: boolean;
}
interface ForwardBridgeToolCallArgs {
    arguments: Record<string, unknown>;
    providerThreadId: string;
    /**
     * The session the pending call belongs to. `resolvePendingToolCalls`
     * error-resolves by scope identity, so a bridge passes its own session
     * object and settles that session's calls on close/replace without touching
     * calls minted by a successor session under the same thread id.
     */
    scope: object;
    threadId: string;
    toolName: string;
}
interface PendingToolCallTracker {
    /**
     * Mints an `item/tool/call` JSON-RPC request toward the runtime and returns
     * a promise settled by the matching response (or by
     * `resolvePendingToolCalls`). Never rejects: failures resolve as
     * `isError: true` results.
     */
    forwardToolCall: (args: ForwardBridgeToolCallArgs) => Promise<BridgeToolCallResult>;
    /** Returns true when the response settled a pending tool call. */
    handleToolCallResponse: (response: BridgeJsonRpcResponse) => boolean;
    /** Error-resolves every pending call minted under `scope`. */
    resolvePendingToolCalls: (scope: object, message: string) => void;
}
/**
 * Tracks the bridge's outgoing tool-call requests: mints request ids, sends
 * the `item/tool/call` envelope, and matches responses back to their waiting
 * promise via `decodeToolCallResponsePayload`.
 */
declare function createPendingToolCallTracker(options: {
    sendToolCall: (request: BridgeToolCallRequest) => void;
}): PendingToolCallTracker;

/**
 * The single statement of when an interactive provider request is answered
 * without ever reaching the user.
 *
 * Both sides of the bridge boundary enforce it and they must agree: a bridge
 * auto-denies its provider's own permission prompts, and the runtime
 * auto-denies the inbound requests that still arrive (a bridge whose provider
 * only learns the policy after the prompt is already in flight). Stating it
 * twice is how the two sides drift, so it lives in the kit — the one place a
 * plugin-shipped bridge and `@bb/agent-runtime` can both import from.
 */

interface InteractiveRequestPolicyInput {
    permissionEscalation: PermissionEscalation | null;
}
declare function shouldAutoDenyInteractiveRequest(policy: InteractiveRequestPolicyInput): boolean;

/**
 * The bridge export shape.
 *
 * A provider bridge is a module inside its plugin's `bb.host` artifact that
 * *exports* its surface instead of starting itself: the daemon-side bootstrap
 * imports the artifact, finds this export, and owns the process boundary
 * (argv, plugin-scoped directories, stdin framing, signals). That inversion is
 * what lets one artifact carry both a bridge and a host RPC entry, and what
 * lets a bridge be imported by tests without taking over stdio.
 */
/** The name a bridge must export from its plugin's host artifact. */
declare const PROVIDER_BRIDGE_EXPORT_NAME = "experimental_providerBridge";
/** Where this bridge process may keep files, scoped to the owning plugin. */
interface ProviderBridgeContext {
    /** The plugin that ships this bridge. */
    pluginId: string;
    /** Persistent, per-plugin, survives daemon restarts and plugin updates. */
    dataDir: string;
    /** This process only; removed when it exits. */
    tempDir: string;
}
interface ProviderBridgeDefinition {
    /** One decoded stdin line of the Provider Bridge Protocol. */
    handleLine: (line: string) => void;
    /**
     * Called once before the first line is read, with the process's
     * plugin-scoped directories. Omit it when the bridge keeps no files.
     */
    start?: (context: ProviderBridgeContext) => void;
    /** Stdin closed: the runtime is gone and the bridge must shut down. */
    onClose?: () => void;
    onSigterm?: () => void;
    onSigint?: () => void;
}
interface ProviderBridgeEntry extends ProviderBridgeDefinition {
    /** Bumped when the bootstrap↔bridge contract changes incompatibly. */
    experimental_apiVersion: 1;
}
declare function experimental_defineProviderBridge(definition: ProviderBridgeDefinition): ProviderBridgeEntry;

type JsonRpcObject = Record<string, unknown>;
interface JsonRpcMessage extends JsonRpcObject {
    jsonrpc: "2.0";
    id?: string | number;
    method: string;
    params?: unknown;
}
interface ProviderInboundRequest {
    id?: string | number;
    method: string;
    params?: unknown;
}
type ProviderRuntimeEvent = JsonRpcObject;
declare class ProviderRequestDecodeError extends Error {
    readonly code = -32602;
    constructor(message: string);
}
declare class ProviderResponseEncodeError extends Error {
    readonly code = -32602;
    constructor(message: string);
}

type ProviderRawEventCoverage = "noise" | "normalized" | "unknown";
interface ProviderRawEventDescription {
    kind: string;
    coverage: ProviderRawEventCoverage;
}
interface ProviderParsedRawEvent {
    kind: string;
}
interface ProviderVisibilityMetadata<TRawEvent extends ProviderParsedRawEvent = ProviderParsedRawEvent> {
    parseRawEvent(event: JsonRpcMessage): TRawEvent;
    describeParsedRawEvent(event: TRawEvent): ProviderRawEventDescription;
    describeRawEvent(event: JsonRpcMessage): ProviderRawEventDescription;
}
interface CreateProviderVisibilityMetadataArgs<TRawEvent extends ProviderParsedRawEvent> {
    parseRawEvent(event: JsonRpcMessage): TRawEvent;
    describeParsedRawEvent(event: TRawEvent): ProviderRawEventDescription;
}
declare function createProviderVisibilityMetadata<TRawEvent extends ProviderParsedRawEvent>(args: CreateProviderVisibilityMetadataArgs<TRawEvent>): ProviderVisibilityMetadata<TRawEvent>;

interface StringRecord {
    [key: string]: unknown;
}
declare function isRecord(value: unknown): value is StringRecord;
declare function getRecordProperty(value: StringRecord, key: string): StringRecord | null;
declare function getStringProperty(value: StringRecord, key: string): string | undefined;
declare function getRawSdkMessage(event: JsonRpcMessage): StringRecord | null;

/**
 * Zod schemas for well-known tool arguments used by both Claude Code and Pi
 * bridges.
 *
 * These tools genuinely use different arg names across SDK versions, so the
 * schemas express the real variants rather than picking one.
 */
declare const bashArgsSchema: z.ZodObject<{
    command: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
declare const textBlockSchema: z.ZodObject<{
    text: z.ZodString;
    type: z.ZodLiteral<"text">;
}, z.core.$strip>;

/**
 * The bb Provider Bridge Protocol version.
 *
 * Negotiated in both directions during `initialize`. Bump only for changes an
 * older bridge or runtime cannot tolerate: removing a method, changing the
 * meaning of an existing field, or tightening a previously lenient parse.
 * Additive changes (new optional capability, new method a bridge may not
 * implement, new notification the runtime may not understand) do NOT bump the
 * version — unknown methods answer -32601, unknown notifications are ignored,
 * and unknown capability fields pass through. That tolerance is the point of
 * the protocol: bridges version with their plugin, not with the daemon.
 *
 * Version history:
 * - 2 (2026-08): the narrow-grammar cutover. `thread/event` is gone; the
 *   timeline rides `thread/delta` exclusively and the runtime assembles
 *   canonical events. A version-1 bridge still emits `thread/event`
 *   notifications the runtime no longer understands, so the runtime rejects
 *   a mismatched handshake instead of silently showing an empty timeline.
 * - 1: the original dialect — bridges emitted finished `ThreadEvent`s on
 *   `thread/event`.
 */
declare const PROVIDER_BRIDGE_PROTOCOL_VERSION: 2;

/** Runtime → bridge `initialize` params. */
declare const initializeParamsSchema: z.ZodObject<{
    client: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
    }, z.core.$strip>;
    protocolVersion: z.ZodNumber;
}, z.core.$loose>;
/** Bridge → runtime `initialize` result. */
declare const initializeResultSchema: z.ZodObject<{
    capabilities: z.ZodPipe<z.ZodTransform<{}, unknown>, z.ZodObject<{
        approvalEnforcedBy: z.ZodDefault<z.ZodEnum<{
            provider: "provider";
            runtime: "runtime";
        }>>;
        fork: z.ZodDefault<z.ZodEnum<{
            checkpoint: "checkpoint";
            none: "none";
            tip: "tip";
        }>>;
        sessionRestore: z.ZodDefault<z.ZodBoolean>;
        threadArchive: z.ZodDefault<z.ZodBoolean>;
        threadGoalClear: z.ZodDefault<z.ZodBoolean>;
        threadRename: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$loose>>;
    protocolVersion: z.ZodNumber;
}, z.core.$loose>;
type InitializeResult = z.infer<typeof initializeResultSchema>;

/**
 * The canonical execution options carried on session and turn commands.
 *
 * Deliberately provider-agnostic: there are no provider-specific fields here
 * and none may be added. Provider-flavored knobs (Claude's plan mode, memory
 * and subagent toggles, mock-CLI traffic, …) travel in `providerOptions` — an
 * opaque bag the provider's own plugin derives from its settings and only its
 * bridge interprets. The runtime and server pass it through untouched.
 *
 * The runtime never diffs these options. They ride every command; the bridge
 * reconciles internally (apply live where it can, rebuild its provider
 * session where it must) and a rebuild is always reported via the
 * `session/replaced` notification — never silent.
 */
declare const bridgeExecutionOptionsSchema: z.ZodIntersection<z.ZodObject<{
    envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    instructions: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    providerOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    reasoningLevel: z.ZodOptional<z.ZodEnum<{
        high: "high";
        low: "low";
        max: "max";
        medium: "medium";
        none: "none";
        ultra: "ultra";
        ultracode: "ultracode";
        xhigh: "xhigh";
    }>>;
    serviceTier: z.ZodOptional<z.ZodEnum<{
        default: "default";
        fast: "fast";
    }>>;
}, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
    approvalReviewer: z.ZodLiteral<"user">;
    permissionEscalation: z.ZodEnum<{
        ask: "ask";
        deny: "deny";
    }>;
    permissionMode: z.ZodLiteral<"accept-edits">;
    permissionScope: z.ZodLiteral<"workspace">;
}, z.core.$strip>, z.ZodObject<{
    approvalReviewer: z.ZodLiteral<"automatic">;
    permissionEscalation: z.ZodEnum<{
        ask: "ask";
        deny: "deny";
    }>;
    permissionMode: z.ZodLiteral<"auto">;
    permissionScope: z.ZodLiteral<"workspace">;
}, z.core.$strip>, z.ZodObject<{
    approvalReviewer: z.ZodNull;
    permissionEscalation: z.ZodNull;
    permissionMode: z.ZodLiteral<"full">;
    permissionScope: z.ZodLiteral<"full">;
}, z.core.$strip>], "permissionMode">>;
type BridgeExecutionOptions = z.infer<typeof bridgeExecutionOptionsSchema>;

/**
 * Canonical runtime → bridge request methods. One vocabulary for every
 * provider: a bridge maps these to its provider's native dialect internally
 * (codex `thread/stop` → `turn/interrupt`, `thread/discard` →
 * `thread/archive`, …). Methods gated by a handshake capability are simply
 * never sent to a bridge that did not advertise them.
 */
declare const BRIDGE_REQUEST_METHODS: {
    readonly initialize: "initialize";
    readonly modelList: "model/list";
    readonly threadStart: "thread/start";
    readonly threadResume: "thread/resume";
    readonly threadFork: "thread/fork";
    readonly threadStop: "thread/stop";
    readonly threadDiscard: "thread/discard";
    readonly threadNameSet: "thread/name/set";
    readonly threadArchive: "thread/archive";
    readonly threadUnarchive: "thread/unarchive";
    readonly threadGoalClear: "thread/goal/clear";
    readonly turnStart: "turn/start";
    readonly turnSteer: "turn/steer";
    readonly skillsConfigure: "skills/configure";
};
declare const modelListParamsSchema: z.ZodObject<{
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
declare const threadStartParamsSchema: z.ZodObject<{
    cwd: z.ZodString;
    disallowedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    dynamicTools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        inputSchema: z.ZodUnknown;
        name: z.ZodString;
    }, z.core.$strip>>>;
    input: z.ZodOptional<z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        mentions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            end: z.ZodNumber;
            resource: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"thread">;
                label: z.ZodString;
                projectId: z.ZodOptional<z.ZodString>;
                threadId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"project">;
                label: z.ZodString;
                projectId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"section">;
                label: z.ZodString;
                sectionId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                entryKind: z.ZodEnum<{
                    directory: "directory";
                    file: "file";
                }>;
                kind: z.ZodLiteral<"path">;
                label: z.ZodString;
                path: z.ZodString;
                source: z.ZodEnum<{
                    "thread-storage": "thread-storage";
                    workspace: "workspace";
                }>;
            }, z.core.$strip>, z.ZodObject<{
                argumentHint: z.ZodNullable<z.ZodString>;
                kind: z.ZodLiteral<"command">;
                label: z.ZodString;
                name: z.ZodString;
                origin: z.ZodEnum<{
                    builtin: "builtin";
                    project: "project";
                    user: "user";
                }>;
                source: z.ZodEnum<{
                    command: "command";
                    skill: "skill";
                }>;
                trigger: z.ZodEnum<{
                    "/": "/";
                }>;
            }, z.core.$strip>, z.ZodObject<{
                icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                itemId: z.ZodString;
                kind: z.ZodLiteral<"plugin">;
                label: z.ZodString;
                pluginId: z.ZodString;
            }, z.core.$strip>], "kind">>;
            start: z.ZodNumber;
        }, z.core.$strip>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"image">;
        url: z.ZodString;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        path: z.ZodString;
        type: z.ZodLiteral<"localImage">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        mimeType: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
        sizeBytes: z.ZodOptional<z.ZodNumber>;
        type: z.ZodLiteral<"localFile">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>], "type">>>;
    instructionMode: z.ZodEnum<{
        append: "append";
        replace: "replace";
    }>;
    options: z.ZodIntersection<z.ZodObject<{
        envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        instructions: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        providerOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        reasoningLevel: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
        serviceTier: z.ZodOptional<z.ZodEnum<{
            default: "default";
            fast: "fast";
        }>>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"user">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"accept-edits">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"automatic">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"auto">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodNull;
        permissionEscalation: z.ZodNull;
        permissionMode: z.ZodLiteral<"full">;
        permissionScope: z.ZodLiteral<"full">;
    }, z.core.$strip>], "permissionMode">>;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const threadResumeParamsSchema: z.ZodObject<{
    cwd: z.ZodString;
    disallowedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    dynamicTools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        inputSchema: z.ZodUnknown;
        name: z.ZodString;
    }, z.core.$strip>>>;
    instructionMode: z.ZodEnum<{
        append: "append";
        replace: "replace";
    }>;
    options: z.ZodIntersection<z.ZodObject<{
        envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        instructions: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        providerOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        reasoningLevel: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
        serviceTier: z.ZodOptional<z.ZodEnum<{
            default: "default";
            fast: "fast";
        }>>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"user">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"accept-edits">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"automatic">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"auto">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodNull;
        permissionEscalation: z.ZodNull;
        permissionMode: z.ZodLiteral<"full">;
        permissionScope: z.ZodLiteral<"full">;
    }, z.core.$strip>], "permissionMode">>;
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const threadForkParamsSchema: z.ZodObject<{
    cwd: z.ZodString;
    disallowedTools: z.ZodOptional<z.ZodArray<z.ZodString>>;
    dynamicTools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        inputSchema: z.ZodUnknown;
        name: z.ZodString;
    }, z.core.$strip>>>;
    instructionMode: z.ZodEnum<{
        append: "append";
        replace: "replace";
    }>;
    options: z.ZodIntersection<z.ZodObject<{
        envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        instructions: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        providerOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        reasoningLevel: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
        serviceTier: z.ZodOptional<z.ZodEnum<{
            default: "default";
            fast: "fast";
        }>>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"user">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"accept-edits">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"automatic">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"auto">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodNull;
        permissionEscalation: z.ZodNull;
        permissionMode: z.ZodLiteral<"full">;
        permissionScope: z.ZodLiteral<"full">;
    }, z.core.$strip>], "permissionMode">>;
    sourceProviderCheckpointId: z.ZodOptional<z.ZodString>;
    sourceProviderThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const threadStopParamsSchema: z.ZodObject<{
    activeTurnId: z.ZodNullable<z.ZodString>;
    intent: z.ZodEnum<{
        interrupt: "interrupt";
        release: "release";
    }>;
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const threadDiscardParamsSchema: z.ZodObject<{
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const threadArchiveParamsSchema: z.ZodObject<{
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const threadUnarchiveParamsSchema: z.ZodObject<{
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const threadGoalClearParamsSchema: z.ZodObject<{
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const threadNameSetParamsSchema: z.ZodObject<{
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
    title: z.ZodString;
}, z.core.$loose>;
declare const turnStartParamsSchema: z.ZodObject<{
    clientRequestId: z.ZodString;
    input: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        mentions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            end: z.ZodNumber;
            resource: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"thread">;
                label: z.ZodString;
                projectId: z.ZodOptional<z.ZodString>;
                threadId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"project">;
                label: z.ZodString;
                projectId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"section">;
                label: z.ZodString;
                sectionId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                entryKind: z.ZodEnum<{
                    directory: "directory";
                    file: "file";
                }>;
                kind: z.ZodLiteral<"path">;
                label: z.ZodString;
                path: z.ZodString;
                source: z.ZodEnum<{
                    "thread-storage": "thread-storage";
                    workspace: "workspace";
                }>;
            }, z.core.$strip>, z.ZodObject<{
                argumentHint: z.ZodNullable<z.ZodString>;
                kind: z.ZodLiteral<"command">;
                label: z.ZodString;
                name: z.ZodString;
                origin: z.ZodEnum<{
                    builtin: "builtin";
                    project: "project";
                    user: "user";
                }>;
                source: z.ZodEnum<{
                    command: "command";
                    skill: "skill";
                }>;
                trigger: z.ZodEnum<{
                    "/": "/";
                }>;
            }, z.core.$strip>, z.ZodObject<{
                icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                itemId: z.ZodString;
                kind: z.ZodLiteral<"plugin">;
                label: z.ZodString;
                pluginId: z.ZodString;
            }, z.core.$strip>], "kind">>;
            start: z.ZodNumber;
        }, z.core.$strip>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"image">;
        url: z.ZodString;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        path: z.ZodString;
        type: z.ZodLiteral<"localImage">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        mimeType: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
        sizeBytes: z.ZodOptional<z.ZodNumber>;
        type: z.ZodLiteral<"localFile">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>], "type">>;
    options: z.ZodIntersection<z.ZodObject<{
        envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        instructions: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        providerOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        reasoningLevel: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
        serviceTier: z.ZodOptional<z.ZodEnum<{
            default: "default";
            fast: "fast";
        }>>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"user">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"accept-edits">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"automatic">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"auto">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodNull;
        permissionEscalation: z.ZodNull;
        permissionMode: z.ZodLiteral<"full">;
        permissionScope: z.ZodLiteral<"full">;
    }, z.core.$strip>], "permissionMode">>;
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
declare const turnSteerParamsSchema: z.ZodObject<{
    clientRequestId: z.ZodString;
    expectedTurnId: z.ZodString;
    input: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        mentions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            end: z.ZodNumber;
            resource: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDiscriminatedUnion<[z.ZodObject<{
                kind: z.ZodLiteral<"thread">;
                label: z.ZodString;
                projectId: z.ZodOptional<z.ZodString>;
                threadId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"project">;
                label: z.ZodString;
                projectId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                kind: z.ZodLiteral<"section">;
                label: z.ZodString;
                sectionId: z.ZodString;
            }, z.core.$strip>, z.ZodObject<{
                entryKind: z.ZodEnum<{
                    directory: "directory";
                    file: "file";
                }>;
                kind: z.ZodLiteral<"path">;
                label: z.ZodString;
                path: z.ZodString;
                source: z.ZodEnum<{
                    "thread-storage": "thread-storage";
                    workspace: "workspace";
                }>;
            }, z.core.$strip>, z.ZodObject<{
                argumentHint: z.ZodNullable<z.ZodString>;
                kind: z.ZodLiteral<"command">;
                label: z.ZodString;
                name: z.ZodString;
                origin: z.ZodEnum<{
                    builtin: "builtin";
                    project: "project";
                    user: "user";
                }>;
                source: z.ZodEnum<{
                    command: "command";
                    skill: "skill";
                }>;
                trigger: z.ZodEnum<{
                    "/": "/";
                }>;
            }, z.core.$strip>, z.ZodObject<{
                icon: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                itemId: z.ZodString;
                kind: z.ZodLiteral<"plugin">;
                label: z.ZodString;
                pluginId: z.ZodString;
            }, z.core.$strip>], "kind">>;
            start: z.ZodNumber;
        }, z.core.$strip>>>;
        text: z.ZodString;
        type: z.ZodLiteral<"text">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"image">;
        url: z.ZodString;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        path: z.ZodString;
        type: z.ZodLiteral<"localImage">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        mimeType: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
        sizeBytes: z.ZodOptional<z.ZodNumber>;
        type: z.ZodLiteral<"localFile">;
        visibility: z.ZodOptional<z.ZodEnum<{
            "agent-only": "agent-only";
        }>>;
    }, z.core.$strip>], "type">>;
    options: z.ZodIntersection<z.ZodObject<{
        envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        instructions: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        providerOptions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        reasoningLevel: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
        serviceTier: z.ZodOptional<z.ZodEnum<{
            default: "default";
            fast: "fast";
        }>>;
    }, z.core.$strip>, z.ZodDiscriminatedUnion<[z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"user">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"accept-edits">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodLiteral<"automatic">;
        permissionEscalation: z.ZodEnum<{
            ask: "ask";
            deny: "deny";
        }>;
        permissionMode: z.ZodLiteral<"auto">;
        permissionScope: z.ZodLiteral<"workspace">;
    }, z.core.$strip>, z.ZodObject<{
        approvalReviewer: z.ZodNull;
        permissionEscalation: z.ZodNull;
        permissionMode: z.ZodLiteral<"full">;
        permissionScope: z.ZodLiteral<"full">;
    }, z.core.$strip>], "permissionMode">>;
    providerThreadId: z.ZodString;
    threadId: z.ZodString;
}, z.core.$loose>;
/**
 * The canonical skill-injection payload. One shape for every provider: the
 * staged roots plus their skills. Each bridge transforms a root into its
 * provider's native form (a Claude local plugin, a codex extra skills root, a
 * pi additional skill path, an ACP prompt listing) — the per-provider shapes
 * never cross the wire.
 */
declare const skillsConfigureParamsSchema: z.ZodObject<{
    roots: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        path: z.ZodString;
        skills: z.ZodArray<z.ZodObject<{
            description: z.ZodString;
            name: z.ZodString;
        }, z.core.$loose>>;
    }, z.core.$loose>>;
}, z.core.$loose>;

/**
 * Bridge → runtime notifications. Everything timeline-bound (assistant text,
 * tool calls, token usage, context-window usage, …) rides `thread/delta`
 * (see thread-delta.ts) as parsed semantic deltas the runtime's assembler
 * turns into canonical `ThreadEvent`s. The notifications here are runtime
 * signals that are not timeline events.
 */
declare const BRIDGE_NOTIFICATION_METHODS: {
    readonly threadIdentity: "thread/identity";
    readonly sessionReplaced: "session/replaced";
    readonly threadOpenWork: "thread/openWork";
    readonly providerRaw: "provider/raw";
    readonly error: "error";
};

/**
 * Bridge → runtime requests: the two channels where the provider needs an
 * answer from bb mid-turn. Both carry canonical bb shapes — the bridge maps
 * its provider's native forms in both directions.
 */
declare const BRIDGE_INBOUND_REQUEST_METHODS: {
    readonly toolCall: "item/tool/call";
    readonly interactionRequest: "interaction/request";
};

/**
 * JSON-RPC error codes on the bridge wire.
 *
 * The hygiene rules these back (from #853): an undecodable request is
 * answered with `INVALID_PARAMS` carrying the validation issues — never
 * silently dropped; an unrecognized method is answered with
 * `METHOD_NOT_FOUND`; request vs response is discriminated on the presence of
 * `method`, never on result-shape guessing.
 */
declare const BRIDGE_JSON_RPC_ERRORS: {
    /** Standard JSON-RPC: params failed schema validation. */
    readonly INVALID_PARAMS: -32602;
    /** Standard JSON-RPC: method not implemented by this bridge. */
    readonly METHOD_NOT_FOUND: -32601;
    /** Generic bridge failure. */
    readonly BRIDGE_ERROR: -32000;
    /** A turn/steer arrived but the session has no active turn. */
    readonly NO_ACTIVE_TURN: -32001;
    /** thread/resume for a session the provider can no longer restore. */
    readonly SESSION_NOT_RESTORABLE: -32002;
    /** thread/fork with a checkpoint on a bridge that only forks at the tip. */
    readonly FORK_CHECKPOINT_UNSUPPORTED: -32003;
};

declare const THREAD_DELTA_NOTIFICATION_METHOD = "thread/delta";
/**
 * Provider-native join key for an item. `providerItemId` is the provider's
 * own id (a tool-call id); `channel` distinguishes provider-anonymous item
 * families (e.g. compaction); `parentRef` is the provider-native id of the
 * parent tool call for nested items. The assembler translates all of these to
 * bb-minted ids.
 */
declare const deltaItemKeySchema: z.ZodObject<{
    channel: z.ZodOptional<z.ZodString>;
    parentRef: z.ZodOptional<z.ZodString>;
    providerItemId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type DeltaItemKey = z.infer<typeof deltaItemKeySchema>;
/**
 * The parsed item shapes a bridge classifies its provider's tool traffic
 * into. Everything richer (diffs, pending statuses, echoed fields on close)
 * is assembler-owned construction. Output-ish optional fields (aggregated
 * output, exit code, results) exist for providers whose native item payloads
 * carry them wholesale (codex); the generic close fields win when both are
 * present.
 */
declare const deltaFileChangeSchema: z.ZodObject<{
    diff: z.ZodOptional<z.ZodString>;
    kind: z.ZodEnum<{
        add: "add";
        delete: "delete";
        update: "update";
    }>;
    movePath: z.ZodOptional<z.ZodString>;
    newText: z.ZodOptional<z.ZodString>;
    oldText: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
}, z.core.$strip>;
type DeltaFileChange = z.infer<typeof deltaFileChangeSchema>;
/**
 * A provider background task (claude workflows, backgrounded shells and
 * subagents). The full snapshot is re-embedded per event — the bridge owns the
 * dialect fold (per-index workflow records, generation counting) and the
 * assembler only re-emits it. The family's canonical events are structurally
 * thread-scoped by the domain grammar (`item/backgroundTask/progress` and
 * `item/backgroundTask/completed`), so its progress/close deltas need no open
 * turn; only the spawning `item.open` (→ `item/started`) is turn-scoped.
 */
declare const deltaBackgroundTaskShapeSchema: z.ZodObject<{
    description: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    outputFile: z.ZodOptional<z.ZodString>;
    skipTranscript: z.ZodBoolean;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        interrupted: "interrupted";
        pending: "pending";
    }>;
    summary: z.ZodOptional<z.ZodString>;
    taskStatus: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        killed: "killed";
        paused: "paused";
        pending: "pending";
        running: "running";
        stopped: "stopped";
    }>;
    taskType: z.ZodString;
    type: z.ZodLiteral<"backgroundTask">;
    usage: z.ZodOptional<z.ZodObject<{
        durationMs: z.ZodNumber;
        toolUses: z.ZodNumber;
        totalTokens: z.ZodNumber;
    }, z.core.$strip>>;
    workflow: z.ZodOptional<z.ZodObject<{
        agents: z.ZodArray<z.ZodObject<{
            agentType: z.ZodOptional<z.ZodString>;
            attempt: z.ZodNumber;
            cached: z.ZodBoolean;
            durationMs: z.ZodOptional<z.ZodNumber>;
            error: z.ZodOptional<z.ZodString>;
            index: z.ZodNumber;
            isolation: z.ZodOptional<z.ZodString>;
            label: z.ZodString;
            lastProgressAt: z.ZodNumber;
            lastToolName: z.ZodOptional<z.ZodString>;
            lastToolSummary: z.ZodOptional<z.ZodString>;
            model: z.ZodString;
            phaseIndex: z.ZodOptional<z.ZodNumber>;
            phaseTitle: z.ZodOptional<z.ZodString>;
            promptPreview: z.ZodOptional<z.ZodString>;
            queuedAt: z.ZodOptional<z.ZodNumber>;
            resultPreview: z.ZodOptional<z.ZodString>;
            startedAt: z.ZodOptional<z.ZodNumber>;
            state: z.ZodEnum<{
                done: "done";
                failed: "failed";
                queued: "queued";
                running: "running";
                skipped: "skipped";
            }>;
            tokens: z.ZodOptional<z.ZodNumber>;
            toolCalls: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        phases: z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            kind: z.ZodOptional<z.ZodString>;
            title: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    workflowName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type DeltaBackgroundTaskShape = z.infer<typeof deltaBackgroundTaskShapeSchema>;
declare const deltaItemShapeSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    aggregatedOutput: z.ZodOptional<z.ZodString>;
    command: z.ZodString;
    cwd: z.ZodString;
    durationMs: z.ZodOptional<z.ZodNumber>;
    exitCode: z.ZodOptional<z.ZodNumber>;
    type: z.ZodLiteral<"command">;
}, z.core.$strip>, z.ZodObject<{
    changes: z.ZodArray<z.ZodObject<{
        diff: z.ZodOptional<z.ZodString>;
        kind: z.ZodEnum<{
            add: "add";
            delete: "delete";
            update: "update";
        }>;
        movePath: z.ZodOptional<z.ZodString>;
        newText: z.ZodOptional<z.ZodString>;
        oldText: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
    }, z.core.$strip>>;
    type: z.ZodLiteral<"fileChange">;
}, z.core.$strip>, z.ZodObject<{
    args: z.ZodOptional<z.ZodUnknown>;
    durationMs: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    result: z.ZodOptional<z.ZodUnknown>;
    server: z.ZodOptional<z.ZodString>;
    tool: z.ZodString;
    type: z.ZodLiteral<"tool">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"compaction">;
}, z.core.$strip>, z.ZodObject<{
    text: z.ZodString;
    type: z.ZodLiteral<"agentMessage">;
}, z.core.$strip>, z.ZodObject<{
    content: z.ZodArray<z.ZodString>;
    summary: z.ZodArray<z.ZodString>;
    type: z.ZodLiteral<"reasoning">;
}, z.core.$strip>, z.ZodObject<{
    text: z.ZodString;
    type: z.ZodLiteral<"plan">;
}, z.core.$strip>, z.ZodObject<{
    queries: z.ZodArray<z.ZodString>;
    type: z.ZodLiteral<"webSearch">;
}, z.core.$strip>, z.ZodObject<{
    pattern: z.ZodNullable<z.ZodString>;
    prompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodLiteral<"webFetch">;
    url: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    path: z.ZodString;
    type: z.ZodLiteral<"imageView">;
}, z.core.$strip>, z.ZodObject<{
    description: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    outputFile: z.ZodOptional<z.ZodString>;
    skipTranscript: z.ZodBoolean;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        interrupted: "interrupted";
        pending: "pending";
    }>;
    summary: z.ZodOptional<z.ZodString>;
    taskStatus: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        killed: "killed";
        paused: "paused";
        pending: "pending";
        running: "running";
        stopped: "stopped";
    }>;
    taskType: z.ZodString;
    type: z.ZodLiteral<"backgroundTask">;
    usage: z.ZodOptional<z.ZodObject<{
        durationMs: z.ZodNumber;
        toolUses: z.ZodNumber;
        totalTokens: z.ZodNumber;
    }, z.core.$strip>>;
    workflow: z.ZodOptional<z.ZodObject<{
        agents: z.ZodArray<z.ZodObject<{
            agentType: z.ZodOptional<z.ZodString>;
            attempt: z.ZodNumber;
            cached: z.ZodBoolean;
            durationMs: z.ZodOptional<z.ZodNumber>;
            error: z.ZodOptional<z.ZodString>;
            index: z.ZodNumber;
            isolation: z.ZodOptional<z.ZodString>;
            label: z.ZodString;
            lastProgressAt: z.ZodNumber;
            lastToolName: z.ZodOptional<z.ZodString>;
            lastToolSummary: z.ZodOptional<z.ZodString>;
            model: z.ZodString;
            phaseIndex: z.ZodOptional<z.ZodNumber>;
            phaseTitle: z.ZodOptional<z.ZodString>;
            promptPreview: z.ZodOptional<z.ZodString>;
            queuedAt: z.ZodOptional<z.ZodNumber>;
            resultPreview: z.ZodOptional<z.ZodString>;
            startedAt: z.ZodOptional<z.ZodNumber>;
            state: z.ZodEnum<{
                done: "done";
                failed: "failed";
                queued: "queued";
                running: "running";
                skipped: "skipped";
            }>;
            tokens: z.ZodOptional<z.ZodNumber>;
            toolCalls: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        phases: z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            kind: z.ZodOptional<z.ZodString>;
            title: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    workflowName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "type">;
type DeltaItemShape = z.infer<typeof deltaItemShapeSchema>;
declare const deltaMessageChannelSchema: z.ZodEnum<{
    assistant: "assistant";
    reasoning: "reasoning";
}>;
type DeltaMessageChannel = z.infer<typeof deltaMessageChannelSchema>;
/**
 * Item-keyed text channels (codex): channels that synthesize a delta-first
 * `item/started` for an unknown item id.
 */
declare const deltaTextChannelSchema: z.ZodEnum<{
    agentMessage: "agentMessage";
    plan: "plan";
    reasoningSummary: "reasoningSummary";
    reasoningText: "reasoningText";
}>;
type DeltaTextChannel = z.infer<typeof deltaTextChannelSchema>;
/**
 * Item-keyed output channels (codex): channels that NEVER synthesize an open
 * — fabricating a commandExecution without its command would be worse than
 * the anomaly. The structural split between `item.textDelta` and
 * `item.outputDelta` is what encodes that rule.
 */
declare const deltaOutputChannelSchema: z.ZodEnum<{
    command: "command";
    fileChange: "fileChange";
}>;
type DeltaOutputChannel = z.infer<typeof deltaOutputChannelSchema>;
/**
 * Turnless fallback: item/stream deltas never open turns — only `turn.open`,
 * a claiming `turn.boundary`, and accepted-input lifecycle settlement do.
 * When a turn-scoped delta arrives with no turn to attach to, the assembler
 * surfaces this raw payload as a thread-scoped `provider/unhandled` (the
 * bridges' old "no active turn" guard, applied centrally). Absent, the
 * turnless delta is dropped silently. Irrelevant for deltas carrying a
 * `providerTurnId` (a vouched turn always resolves).
 */
declare const deltaNoTurnFallbackSchema: z.ZodObject<{
    raw: z.ZodObject<{
        id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        jsonrpc: z.ZodLiteral<"2.0">;
        method: z.ZodString;
        params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
    }, z.core.$strip>;
    rawType: z.ZodString;
}, z.core.$strip>;
type DeltaNoTurnFallback = z.infer<typeof deltaNoTurnFallbackSchema>;
declare const threadDeltaSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    clientRequestId: z.ZodString;
    kind: z.ZodLiteral<"input.accepted">;
    providerTurnId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"turn.open">;
    parentRef: z.ZodOptional<z.ZodString>;
    providerTurnId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    claimIfIdle: z.ZodOptional<z.ZodBoolean>;
    error: z.ZodOptional<z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>>;
    kind: z.ZodLiteral<"turn.boundary">;
    providerCheckpointId: z.ZodOptional<z.ZodString>;
    providerTurnId: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        interrupted: "interrupted";
    }>;
}, z.core.$strip>, z.ZodObject<{
    attach: z.ZodOptional<z.ZodEnum<{
        currentOrLast: "currentOrLast";
        open: "open";
    }>>;
    item: z.ZodDiscriminatedUnion<[z.ZodObject<{
        aggregatedOutput: z.ZodOptional<z.ZodString>;
        command: z.ZodString;
        cwd: z.ZodString;
        durationMs: z.ZodOptional<z.ZodNumber>;
        exitCode: z.ZodOptional<z.ZodNumber>;
        type: z.ZodLiteral<"command">;
    }, z.core.$strip>, z.ZodObject<{
        changes: z.ZodArray<z.ZodObject<{
            diff: z.ZodOptional<z.ZodString>;
            kind: z.ZodEnum<{
                add: "add";
                delete: "delete";
                update: "update";
            }>;
            movePath: z.ZodOptional<z.ZodString>;
            newText: z.ZodOptional<z.ZodString>;
            oldText: z.ZodOptional<z.ZodString>;
            path: z.ZodString;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"fileChange">;
    }, z.core.$strip>, z.ZodObject<{
        args: z.ZodOptional<z.ZodUnknown>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        error: z.ZodOptional<z.ZodString>;
        result: z.ZodOptional<z.ZodUnknown>;
        server: z.ZodOptional<z.ZodString>;
        tool: z.ZodString;
        type: z.ZodLiteral<"tool">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"compaction">;
    }, z.core.$strip>, z.ZodObject<{
        text: z.ZodString;
        type: z.ZodLiteral<"agentMessage">;
    }, z.core.$strip>, z.ZodObject<{
        content: z.ZodArray<z.ZodString>;
        summary: z.ZodArray<z.ZodString>;
        type: z.ZodLiteral<"reasoning">;
    }, z.core.$strip>, z.ZodObject<{
        text: z.ZodString;
        type: z.ZodLiteral<"plan">;
    }, z.core.$strip>, z.ZodObject<{
        queries: z.ZodArray<z.ZodString>;
        type: z.ZodLiteral<"webSearch">;
    }, z.core.$strip>, z.ZodObject<{
        pattern: z.ZodNullable<z.ZodString>;
        prompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodLiteral<"webFetch">;
        url: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        path: z.ZodString;
        type: z.ZodLiteral<"imageView">;
    }, z.core.$strip>, z.ZodObject<{
        description: z.ZodString;
        error: z.ZodOptional<z.ZodString>;
        outputFile: z.ZodOptional<z.ZodString>;
        skipTranscript: z.ZodBoolean;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            interrupted: "interrupted";
            pending: "pending";
        }>;
        summary: z.ZodOptional<z.ZodString>;
        taskStatus: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            killed: "killed";
            paused: "paused";
            pending: "pending";
            running: "running";
            stopped: "stopped";
        }>;
        taskType: z.ZodString;
        type: z.ZodLiteral<"backgroundTask">;
        usage: z.ZodOptional<z.ZodObject<{
            durationMs: z.ZodNumber;
            toolUses: z.ZodNumber;
            totalTokens: z.ZodNumber;
        }, z.core.$strip>>;
        workflow: z.ZodOptional<z.ZodObject<{
            agents: z.ZodArray<z.ZodObject<{
                agentType: z.ZodOptional<z.ZodString>;
                attempt: z.ZodNumber;
                cached: z.ZodBoolean;
                durationMs: z.ZodOptional<z.ZodNumber>;
                error: z.ZodOptional<z.ZodString>;
                index: z.ZodNumber;
                isolation: z.ZodOptional<z.ZodString>;
                label: z.ZodString;
                lastProgressAt: z.ZodNumber;
                lastToolName: z.ZodOptional<z.ZodString>;
                lastToolSummary: z.ZodOptional<z.ZodString>;
                model: z.ZodString;
                phaseIndex: z.ZodOptional<z.ZodNumber>;
                phaseTitle: z.ZodOptional<z.ZodString>;
                promptPreview: z.ZodOptional<z.ZodString>;
                queuedAt: z.ZodOptional<z.ZodNumber>;
                resultPreview: z.ZodOptional<z.ZodString>;
                startedAt: z.ZodOptional<z.ZodNumber>;
                state: z.ZodEnum<{
                    done: "done";
                    failed: "failed";
                    queued: "queued";
                    running: "running";
                    skipped: "skipped";
                }>;
                tokens: z.ZodOptional<z.ZodNumber>;
                toolCalls: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            phases: z.ZodArray<z.ZodObject<{
                index: z.ZodNumber;
                kind: z.ZodOptional<z.ZodString>;
                title: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        workflowName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], "type">;
    key: z.ZodObject<{
        channel: z.ZodOptional<z.ZodString>;
        parentRef: z.ZodOptional<z.ZodString>;
        providerItemId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    kind: z.ZodLiteral<"item.open">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    providerTurnId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    aggregatedOutput: z.ZodOptional<z.ZodString>;
    approvalStatus: z.ZodOptional<z.ZodLiteral<"denied">>;
    exitCode: z.ZodOptional<z.ZodNumber>;
    item: z.ZodDiscriminatedUnion<[z.ZodObject<{
        aggregatedOutput: z.ZodOptional<z.ZodString>;
        command: z.ZodString;
        cwd: z.ZodString;
        durationMs: z.ZodOptional<z.ZodNumber>;
        exitCode: z.ZodOptional<z.ZodNumber>;
        type: z.ZodLiteral<"command">;
    }, z.core.$strip>, z.ZodObject<{
        changes: z.ZodArray<z.ZodObject<{
            diff: z.ZodOptional<z.ZodString>;
            kind: z.ZodEnum<{
                add: "add";
                delete: "delete";
                update: "update";
            }>;
            movePath: z.ZodOptional<z.ZodString>;
            newText: z.ZodOptional<z.ZodString>;
            oldText: z.ZodOptional<z.ZodString>;
            path: z.ZodString;
        }, z.core.$strip>>;
        type: z.ZodLiteral<"fileChange">;
    }, z.core.$strip>, z.ZodObject<{
        args: z.ZodOptional<z.ZodUnknown>;
        durationMs: z.ZodOptional<z.ZodNumber>;
        error: z.ZodOptional<z.ZodString>;
        result: z.ZodOptional<z.ZodUnknown>;
        server: z.ZodOptional<z.ZodString>;
        tool: z.ZodString;
        type: z.ZodLiteral<"tool">;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"compaction">;
    }, z.core.$strip>, z.ZodObject<{
        text: z.ZodString;
        type: z.ZodLiteral<"agentMessage">;
    }, z.core.$strip>, z.ZodObject<{
        content: z.ZodArray<z.ZodString>;
        summary: z.ZodArray<z.ZodString>;
        type: z.ZodLiteral<"reasoning">;
    }, z.core.$strip>, z.ZodObject<{
        text: z.ZodString;
        type: z.ZodLiteral<"plan">;
    }, z.core.$strip>, z.ZodObject<{
        queries: z.ZodArray<z.ZodString>;
        type: z.ZodLiteral<"webSearch">;
    }, z.core.$strip>, z.ZodObject<{
        pattern: z.ZodNullable<z.ZodString>;
        prompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        type: z.ZodLiteral<"webFetch">;
        url: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        path: z.ZodString;
        type: z.ZodLiteral<"imageView">;
    }, z.core.$strip>, z.ZodObject<{
        description: z.ZodString;
        error: z.ZodOptional<z.ZodString>;
        outputFile: z.ZodOptional<z.ZodString>;
        skipTranscript: z.ZodBoolean;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            interrupted: "interrupted";
            pending: "pending";
        }>;
        summary: z.ZodOptional<z.ZodString>;
        taskStatus: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            killed: "killed";
            paused: "paused";
            pending: "pending";
            running: "running";
            stopped: "stopped";
        }>;
        taskType: z.ZodString;
        type: z.ZodLiteral<"backgroundTask">;
        usage: z.ZodOptional<z.ZodObject<{
            durationMs: z.ZodNumber;
            toolUses: z.ZodNumber;
            totalTokens: z.ZodNumber;
        }, z.core.$strip>>;
        workflow: z.ZodOptional<z.ZodObject<{
            agents: z.ZodArray<z.ZodObject<{
                agentType: z.ZodOptional<z.ZodString>;
                attempt: z.ZodNumber;
                cached: z.ZodBoolean;
                durationMs: z.ZodOptional<z.ZodNumber>;
                error: z.ZodOptional<z.ZodString>;
                index: z.ZodNumber;
                isolation: z.ZodOptional<z.ZodString>;
                label: z.ZodString;
                lastProgressAt: z.ZodNumber;
                lastToolName: z.ZodOptional<z.ZodString>;
                lastToolSummary: z.ZodOptional<z.ZodString>;
                model: z.ZodString;
                phaseIndex: z.ZodOptional<z.ZodNumber>;
                phaseTitle: z.ZodOptional<z.ZodString>;
                promptPreview: z.ZodOptional<z.ZodString>;
                queuedAt: z.ZodOptional<z.ZodNumber>;
                resultPreview: z.ZodOptional<z.ZodString>;
                startedAt: z.ZodOptional<z.ZodNumber>;
                state: z.ZodEnum<{
                    done: "done";
                    failed: "failed";
                    queued: "queued";
                    running: "running";
                    skipped: "skipped";
                }>;
                tokens: z.ZodOptional<z.ZodNumber>;
                toolCalls: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            phases: z.ZodArray<z.ZodObject<{
                index: z.ZodNumber;
                kind: z.ZodOptional<z.ZodString>;
                title: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        workflowName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], "type">;
    key: z.ZodObject<{
        channel: z.ZodOptional<z.ZodString>;
        parentRef: z.ZodOptional<z.ZodString>;
        providerItemId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    kind: z.ZodLiteral<"item.close">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    providerTurnId: z.ZodOptional<z.ZodString>;
    resultText: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        interrupted: "interrupted";
        pending: "pending";
    }>;
}, z.core.$strip>, z.ZodObject<{
    explanation: z.ZodOptional<z.ZodString>;
    kind: z.ZodLiteral<"turn.plan">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    providerTurnId: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            completed: "completed";
            failed: "failed";
            pending: "pending";
        }>>;
        step: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    flush: z.ZodOptional<z.ZodBoolean>;
    key: z.ZodObject<{
        channel: z.ZodOptional<z.ZodString>;
        parentRef: z.ZodOptional<z.ZodString>;
        providerItemId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    kind: z.ZodLiteral<"item.progress">;
    message: z.ZodOptional<z.ZodString>;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    providerTurnId: z.ZodOptional<z.ZodString>;
    snapshot: z.ZodOptional<z.ZodObject<{
        description: z.ZodString;
        error: z.ZodOptional<z.ZodString>;
        outputFile: z.ZodOptional<z.ZodString>;
        skipTranscript: z.ZodBoolean;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            interrupted: "interrupted";
            pending: "pending";
        }>;
        summary: z.ZodOptional<z.ZodString>;
        taskStatus: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            killed: "killed";
            paused: "paused";
            pending: "pending";
            running: "running";
            stopped: "stopped";
        }>;
        taskType: z.ZodString;
        type: z.ZodLiteral<"backgroundTask">;
        usage: z.ZodOptional<z.ZodObject<{
            durationMs: z.ZodNumber;
            toolUses: z.ZodNumber;
            totalTokens: z.ZodNumber;
        }, z.core.$strip>>;
        workflow: z.ZodOptional<z.ZodObject<{
            agents: z.ZodArray<z.ZodObject<{
                agentType: z.ZodOptional<z.ZodString>;
                attempt: z.ZodNumber;
                cached: z.ZodBoolean;
                durationMs: z.ZodOptional<z.ZodNumber>;
                error: z.ZodOptional<z.ZodString>;
                index: z.ZodNumber;
                isolation: z.ZodOptional<z.ZodString>;
                label: z.ZodString;
                lastProgressAt: z.ZodNumber;
                lastToolName: z.ZodOptional<z.ZodString>;
                lastToolSummary: z.ZodOptional<z.ZodString>;
                model: z.ZodString;
                phaseIndex: z.ZodOptional<z.ZodNumber>;
                phaseTitle: z.ZodOptional<z.ZodString>;
                promptPreview: z.ZodOptional<z.ZodString>;
                queuedAt: z.ZodOptional<z.ZodNumber>;
                resultPreview: z.ZodOptional<z.ZodString>;
                startedAt: z.ZodOptional<z.ZodNumber>;
                state: z.ZodEnum<{
                    done: "done";
                    failed: "failed";
                    queued: "queued";
                    running: "running";
                    skipped: "skipped";
                }>;
                tokens: z.ZodOptional<z.ZodNumber>;
                toolCalls: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            phases: z.ZodArray<z.ZodObject<{
                index: z.ZodNumber;
                kind: z.ZodOptional<z.ZodString>;
                title: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        workflowName: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    channel: z.ZodEnum<{
        assistant: "assistant";
        reasoning: "reasoning";
    }>;
    kind: z.ZodLiteral<"message.delta">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    parentRef: z.ZodOptional<z.ZodString>;
    streamKey: z.ZodString;
    text: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    channel: z.ZodEnum<{
        assistant: "assistant";
        reasoning: "reasoning";
    }>;
    detach: z.ZodOptional<z.ZodBoolean>;
    kind: z.ZodLiteral<"message.close">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    parentRef: z.ZodOptional<z.ZodString>;
    streamKey: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    channel: z.ZodEnum<{
        agentMessage: "agentMessage";
        plan: "plan";
        reasoningSummary: "reasoningSummary";
        reasoningText: "reasoningText";
    }>;
    key: z.ZodObject<{
        channel: z.ZodOptional<z.ZodString>;
        parentRef: z.ZodOptional<z.ZodString>;
        providerItemId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    kind: z.ZodLiteral<"item.textDelta">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    providerTurnId: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    channel: z.ZodEnum<{
        command: "command";
        fileChange: "fileChange";
    }>;
    key: z.ZodObject<{
        channel: z.ZodOptional<z.ZodString>;
        parentRef: z.ZodOptional<z.ZodString>;
        providerItemId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    kind: z.ZodLiteral<"item.outputDelta">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    providerTurnId: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    key: z.ZodObject<{
        channel: z.ZodOptional<z.ZodString>;
        parentRef: z.ZodOptional<z.ZodString>;
        providerItemId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    kind: z.ZodLiteral<"command.outputSnapshot">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    text: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"usage.turn">;
    modelContextWindow: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    tokens: z.ZodObject<{
        cachedInputTokens: z.ZodNumber;
        inputTokens: z.ZodNumber;
        outputTokens: z.ZodNumber;
        reasoningOutputTokens: z.ZodNumber;
        totalTokens: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"usage.exact">;
    last: z.ZodObject<{
        cachedInputTokens: z.ZodNumber;
        inputTokens: z.ZodNumber;
        outputTokens: z.ZodNumber;
        reasoningOutputTokens: z.ZodNumber;
        totalTokens: z.ZodNumber;
    }, z.core.$strip>;
    modelContextWindow: z.ZodNullable<z.ZodNumber>;
    providerTurnId: z.ZodOptional<z.ZodString>;
    total: z.ZodObject<{
        cachedInputTokens: z.ZodNumber;
        inputTokens: z.ZodNumber;
        outputTokens: z.ZodNumber;
        reasoningOutputTokens: z.ZodNumber;
        totalTokens: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    attach: z.ZodEnum<{
        currentOrLast: "currentOrLast";
        open: "open";
    }>;
    estimated: z.ZodBoolean;
    kind: z.ZodLiteral<"contextWindow">;
    size: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    used: z.ZodNullable<z.ZodNumber>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"context.compacted">;
    noTurnFallback: z.ZodOptional<z.ZodObject<{
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
    }, z.core.$strip>>;
    providerTurnId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"context.cleared">;
}, z.core.$strip>, z.ZodObject<{
    diff: z.ZodString;
    kind: z.ZodLiteral<"turn.diff">;
    providerTurnId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"thread.started">;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"thread.identity">;
    providerThreadId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"thread.name">;
    name: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"thread.goal">;
    objective: z.ZodString;
    status: z.ZodEnum<{
        active: "active";
        budgetLimited: "budgetLimited";
        complete: "complete";
        paused: "paused";
    }>;
    timeUsedSeconds: z.ZodNumber;
    tokenBudget: z.ZodNullable<z.ZodNumber>;
    tokensUsed: z.ZodNumber;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"thread.goalCleared">;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"provider.rateLimits">;
    rateLimits: z.ZodObject<{
        kind: z.ZodEnum<{
            "spend-control": "spend-control";
            "subscription-window": "subscription-window";
            credits: "credits";
            unknown: "unknown";
        }>;
        overageReason: z.ZodNullable<z.ZodString>;
        overageStatus: z.ZodNullable<z.ZodEnum<{
            allowed: "allowed";
            rejected: "rejected";
            unavailable: "unavailable";
            warning: "warning";
        }>>;
        providerId: z.ZodString;
        reachedReason: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<{
            allowed: "allowed";
            blocked: "blocked";
            unknown: "unknown";
            warning: "warning";
        }>;
        windows: z.ZodArray<z.ZodObject<{
            label: z.ZodNullable<z.ZodString>;
            providerKey: z.ZodNullable<z.ZodString>;
            resetsAtMs: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<{
                allowed: "allowed";
                blocked: "blocked";
                unknown: "unknown";
                warning: "warning";
            }>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        "active-turn-not-steerable": "active-turn-not-steerable";
        "bad-request": "bad-request";
        "budget-exceeded": "budget-exceeded";
        "connection-failed": "connection-failed";
        "context-window-exceeded": "context-window-exceeded";
        "max-output-tokens": "max-output-tokens";
        "max-turns": "max-turns";
        "rate-limit": "rate-limit";
        "stream-disconnected": "stream-disconnected";
        "structured-output-retries": "structured-output-retries";
        "thread-rollback-failed": "thread-rollback-failed";
        "too-many-failed-attempts": "too-many-failed-attempts";
        billing: "billing";
        internal: "internal";
        overloaded: "overloaded";
        policy: "policy";
        sandbox: "sandbox";
        unauthorized: "unauthorized";
        unknown: "unknown";
    }>>;
    detail: z.ZodOptional<z.ZodString>;
    errorInfo: z.ZodOptional<z.ZodObject<{
        category: z.ZodEnum<{
            "active-turn-not-steerable": "active-turn-not-steerable";
            "bad-request": "bad-request";
            "budget-exceeded": "budget-exceeded";
            "connection-failed": "connection-failed";
            "context-window-exceeded": "context-window-exceeded";
            "max-output-tokens": "max-output-tokens";
            "max-turns": "max-turns";
            "rate-limit": "rate-limit";
            "stream-disconnected": "stream-disconnected";
            "structured-output-retries": "structured-output-retries";
            "thread-rollback-failed": "thread-rollback-failed";
            "too-many-failed-attempts": "too-many-failed-attempts";
            billing: "billing";
            internal: "internal";
            overloaded: "overloaded";
            policy: "policy";
            sandbox: "sandbox";
            unauthorized: "unauthorized";
            unknown: "unknown";
        }>;
        httpStatusCode: z.ZodNullable<z.ZodNumber>;
        providerCode: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
    kind: z.ZodLiteral<"provider.error">;
    message: z.ZodString;
    providerTurnId: z.ZodOptional<z.ZodString>;
    settlesTurn: z.ZodOptional<z.ZodBoolean>;
    threadScoped: z.ZodOptional<z.ZodBoolean>;
    willRetry: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    fallbackModel: z.ZodString;
    kind: z.ZodLiteral<"provider.modelFallback">;
    message: z.ZodString;
    originalModel: z.ZodString;
    reason: z.ZodEnum<{
        provider: "provider";
        refusal: "refusal";
    }>;
}, z.core.$strip>, z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        "compaction-skipped": "compaction-skipped";
        config: "config";
        deprecation: "deprecation";
        general: "general";
    }>>;
    details: z.ZodOptional<z.ZodString>;
    kind: z.ZodLiteral<"provider.warning">;
    summary: z.ZodOptional<z.ZodString>;
    vouchedTurn: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"unhandled">;
    onlyIfNoTurn: z.ZodOptional<z.ZodBoolean>;
    parentRef: z.ZodOptional<z.ZodString>;
    providerTurnId: z.ZodOptional<z.ZodString>;
    raw: z.ZodObject<{
        id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
        jsonrpc: z.ZodLiteral<"2.0">;
        method: z.ZodString;
        params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
    }, z.core.$strip>;
    rawType: z.ZodString;
    vouchedTurn: z.ZodBoolean;
}, z.core.$strip>, z.ZodObject<{
    error: z.ZodOptional<z.ZodObject<{
        message: z.ZodString;
    }, z.core.$strip>>;
    kind: z.ZodLiteral<"session.ended">;
    reason: z.ZodEnum<{
        exited: "exited";
        interrupted: "interrupted";
        replaced: "replaced";
    }>;
}, z.core.$strip>, z.ZodObject<{
    kind: z.ZodLiteral<"session.reset">;
}, z.core.$strip>], "kind">;
type ThreadDelta = z.infer<typeof threadDeltaSchema>;
type ThreadDeltaKind = ThreadDelta["kind"];
/** `thread/delta` notification params: batched deltas for one thread. */
declare const threadDeltaNotificationParamsSchema: z.ZodObject<{
    deltas: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        clientRequestId: z.ZodString;
        kind: z.ZodLiteral<"input.accepted">;
        providerTurnId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"turn.open">;
        parentRef: z.ZodOptional<z.ZodString>;
        providerTurnId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        claimIfIdle: z.ZodOptional<z.ZodBoolean>;
        error: z.ZodOptional<z.ZodObject<{
            message: z.ZodString;
        }, z.core.$strip>>;
        kind: z.ZodLiteral<"turn.boundary">;
        providerCheckpointId: z.ZodOptional<z.ZodString>;
        providerTurnId: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            interrupted: "interrupted";
        }>;
    }, z.core.$strip>, z.ZodObject<{
        attach: z.ZodOptional<z.ZodEnum<{
            currentOrLast: "currentOrLast";
            open: "open";
        }>>;
        item: z.ZodDiscriminatedUnion<[z.ZodObject<{
            aggregatedOutput: z.ZodOptional<z.ZodString>;
            command: z.ZodString;
            cwd: z.ZodString;
            durationMs: z.ZodOptional<z.ZodNumber>;
            exitCode: z.ZodOptional<z.ZodNumber>;
            type: z.ZodLiteral<"command">;
        }, z.core.$strip>, z.ZodObject<{
            changes: z.ZodArray<z.ZodObject<{
                diff: z.ZodOptional<z.ZodString>;
                kind: z.ZodEnum<{
                    add: "add";
                    delete: "delete";
                    update: "update";
                }>;
                movePath: z.ZodOptional<z.ZodString>;
                newText: z.ZodOptional<z.ZodString>;
                oldText: z.ZodOptional<z.ZodString>;
                path: z.ZodString;
            }, z.core.$strip>>;
            type: z.ZodLiteral<"fileChange">;
        }, z.core.$strip>, z.ZodObject<{
            args: z.ZodOptional<z.ZodUnknown>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            error: z.ZodOptional<z.ZodString>;
            result: z.ZodOptional<z.ZodUnknown>;
            server: z.ZodOptional<z.ZodString>;
            tool: z.ZodString;
            type: z.ZodLiteral<"tool">;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"compaction">;
        }, z.core.$strip>, z.ZodObject<{
            text: z.ZodString;
            type: z.ZodLiteral<"agentMessage">;
        }, z.core.$strip>, z.ZodObject<{
            content: z.ZodArray<z.ZodString>;
            summary: z.ZodArray<z.ZodString>;
            type: z.ZodLiteral<"reasoning">;
        }, z.core.$strip>, z.ZodObject<{
            text: z.ZodString;
            type: z.ZodLiteral<"plan">;
        }, z.core.$strip>, z.ZodObject<{
            queries: z.ZodArray<z.ZodString>;
            type: z.ZodLiteral<"webSearch">;
        }, z.core.$strip>, z.ZodObject<{
            pattern: z.ZodNullable<z.ZodString>;
            prompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            type: z.ZodLiteral<"webFetch">;
            url: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            path: z.ZodString;
            type: z.ZodLiteral<"imageView">;
        }, z.core.$strip>, z.ZodObject<{
            description: z.ZodString;
            error: z.ZodOptional<z.ZodString>;
            outputFile: z.ZodOptional<z.ZodString>;
            skipTranscript: z.ZodBoolean;
            status: z.ZodEnum<{
                completed: "completed";
                failed: "failed";
                interrupted: "interrupted";
                pending: "pending";
            }>;
            summary: z.ZodOptional<z.ZodString>;
            taskStatus: z.ZodEnum<{
                completed: "completed";
                failed: "failed";
                killed: "killed";
                paused: "paused";
                pending: "pending";
                running: "running";
                stopped: "stopped";
            }>;
            taskType: z.ZodString;
            type: z.ZodLiteral<"backgroundTask">;
            usage: z.ZodOptional<z.ZodObject<{
                durationMs: z.ZodNumber;
                toolUses: z.ZodNumber;
                totalTokens: z.ZodNumber;
            }, z.core.$strip>>;
            workflow: z.ZodOptional<z.ZodObject<{
                agents: z.ZodArray<z.ZodObject<{
                    agentType: z.ZodOptional<z.ZodString>;
                    attempt: z.ZodNumber;
                    cached: z.ZodBoolean;
                    durationMs: z.ZodOptional<z.ZodNumber>;
                    error: z.ZodOptional<z.ZodString>;
                    index: z.ZodNumber;
                    isolation: z.ZodOptional<z.ZodString>;
                    label: z.ZodString;
                    lastProgressAt: z.ZodNumber;
                    lastToolName: z.ZodOptional<z.ZodString>;
                    lastToolSummary: z.ZodOptional<z.ZodString>;
                    model: z.ZodString;
                    phaseIndex: z.ZodOptional<z.ZodNumber>;
                    phaseTitle: z.ZodOptional<z.ZodString>;
                    promptPreview: z.ZodOptional<z.ZodString>;
                    queuedAt: z.ZodOptional<z.ZodNumber>;
                    resultPreview: z.ZodOptional<z.ZodString>;
                    startedAt: z.ZodOptional<z.ZodNumber>;
                    state: z.ZodEnum<{
                        done: "done";
                        failed: "failed";
                        queued: "queued";
                        running: "running";
                        skipped: "skipped";
                    }>;
                    tokens: z.ZodOptional<z.ZodNumber>;
                    toolCalls: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
                phases: z.ZodArray<z.ZodObject<{
                    index: z.ZodNumber;
                    kind: z.ZodOptional<z.ZodString>;
                    title: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            workflowName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>], "type">;
        key: z.ZodObject<{
            channel: z.ZodOptional<z.ZodString>;
            parentRef: z.ZodOptional<z.ZodString>;
            providerItemId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        kind: z.ZodLiteral<"item.open">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        providerTurnId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        aggregatedOutput: z.ZodOptional<z.ZodString>;
        approvalStatus: z.ZodOptional<z.ZodLiteral<"denied">>;
        exitCode: z.ZodOptional<z.ZodNumber>;
        item: z.ZodDiscriminatedUnion<[z.ZodObject<{
            aggregatedOutput: z.ZodOptional<z.ZodString>;
            command: z.ZodString;
            cwd: z.ZodString;
            durationMs: z.ZodOptional<z.ZodNumber>;
            exitCode: z.ZodOptional<z.ZodNumber>;
            type: z.ZodLiteral<"command">;
        }, z.core.$strip>, z.ZodObject<{
            changes: z.ZodArray<z.ZodObject<{
                diff: z.ZodOptional<z.ZodString>;
                kind: z.ZodEnum<{
                    add: "add";
                    delete: "delete";
                    update: "update";
                }>;
                movePath: z.ZodOptional<z.ZodString>;
                newText: z.ZodOptional<z.ZodString>;
                oldText: z.ZodOptional<z.ZodString>;
                path: z.ZodString;
            }, z.core.$strip>>;
            type: z.ZodLiteral<"fileChange">;
        }, z.core.$strip>, z.ZodObject<{
            args: z.ZodOptional<z.ZodUnknown>;
            durationMs: z.ZodOptional<z.ZodNumber>;
            error: z.ZodOptional<z.ZodString>;
            result: z.ZodOptional<z.ZodUnknown>;
            server: z.ZodOptional<z.ZodString>;
            tool: z.ZodString;
            type: z.ZodLiteral<"tool">;
        }, z.core.$strip>, z.ZodObject<{
            type: z.ZodLiteral<"compaction">;
        }, z.core.$strip>, z.ZodObject<{
            text: z.ZodString;
            type: z.ZodLiteral<"agentMessage">;
        }, z.core.$strip>, z.ZodObject<{
            content: z.ZodArray<z.ZodString>;
            summary: z.ZodArray<z.ZodString>;
            type: z.ZodLiteral<"reasoning">;
        }, z.core.$strip>, z.ZodObject<{
            text: z.ZodString;
            type: z.ZodLiteral<"plan">;
        }, z.core.$strip>, z.ZodObject<{
            queries: z.ZodArray<z.ZodString>;
            type: z.ZodLiteral<"webSearch">;
        }, z.core.$strip>, z.ZodObject<{
            pattern: z.ZodNullable<z.ZodString>;
            prompt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            type: z.ZodLiteral<"webFetch">;
            url: z.ZodString;
        }, z.core.$strip>, z.ZodObject<{
            path: z.ZodString;
            type: z.ZodLiteral<"imageView">;
        }, z.core.$strip>, z.ZodObject<{
            description: z.ZodString;
            error: z.ZodOptional<z.ZodString>;
            outputFile: z.ZodOptional<z.ZodString>;
            skipTranscript: z.ZodBoolean;
            status: z.ZodEnum<{
                completed: "completed";
                failed: "failed";
                interrupted: "interrupted";
                pending: "pending";
            }>;
            summary: z.ZodOptional<z.ZodString>;
            taskStatus: z.ZodEnum<{
                completed: "completed";
                failed: "failed";
                killed: "killed";
                paused: "paused";
                pending: "pending";
                running: "running";
                stopped: "stopped";
            }>;
            taskType: z.ZodString;
            type: z.ZodLiteral<"backgroundTask">;
            usage: z.ZodOptional<z.ZodObject<{
                durationMs: z.ZodNumber;
                toolUses: z.ZodNumber;
                totalTokens: z.ZodNumber;
            }, z.core.$strip>>;
            workflow: z.ZodOptional<z.ZodObject<{
                agents: z.ZodArray<z.ZodObject<{
                    agentType: z.ZodOptional<z.ZodString>;
                    attempt: z.ZodNumber;
                    cached: z.ZodBoolean;
                    durationMs: z.ZodOptional<z.ZodNumber>;
                    error: z.ZodOptional<z.ZodString>;
                    index: z.ZodNumber;
                    isolation: z.ZodOptional<z.ZodString>;
                    label: z.ZodString;
                    lastProgressAt: z.ZodNumber;
                    lastToolName: z.ZodOptional<z.ZodString>;
                    lastToolSummary: z.ZodOptional<z.ZodString>;
                    model: z.ZodString;
                    phaseIndex: z.ZodOptional<z.ZodNumber>;
                    phaseTitle: z.ZodOptional<z.ZodString>;
                    promptPreview: z.ZodOptional<z.ZodString>;
                    queuedAt: z.ZodOptional<z.ZodNumber>;
                    resultPreview: z.ZodOptional<z.ZodString>;
                    startedAt: z.ZodOptional<z.ZodNumber>;
                    state: z.ZodEnum<{
                        done: "done";
                        failed: "failed";
                        queued: "queued";
                        running: "running";
                        skipped: "skipped";
                    }>;
                    tokens: z.ZodOptional<z.ZodNumber>;
                    toolCalls: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
                phases: z.ZodArray<z.ZodObject<{
                    index: z.ZodNumber;
                    kind: z.ZodOptional<z.ZodString>;
                    title: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            workflowName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>], "type">;
        key: z.ZodObject<{
            channel: z.ZodOptional<z.ZodString>;
            parentRef: z.ZodOptional<z.ZodString>;
            providerItemId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        kind: z.ZodLiteral<"item.close">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        providerTurnId: z.ZodOptional<z.ZodString>;
        resultText: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            interrupted: "interrupted";
            pending: "pending";
        }>;
    }, z.core.$strip>, z.ZodObject<{
        explanation: z.ZodOptional<z.ZodString>;
        kind: z.ZodLiteral<"turn.plan">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        providerTurnId: z.ZodOptional<z.ZodString>;
        steps: z.ZodArray<z.ZodObject<{
            status: z.ZodOptional<z.ZodEnum<{
                active: "active";
                completed: "completed";
                failed: "failed";
                pending: "pending";
            }>>;
            step: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        flush: z.ZodOptional<z.ZodBoolean>;
        key: z.ZodObject<{
            channel: z.ZodOptional<z.ZodString>;
            parentRef: z.ZodOptional<z.ZodString>;
            providerItemId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        kind: z.ZodLiteral<"item.progress">;
        message: z.ZodOptional<z.ZodString>;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        providerTurnId: z.ZodOptional<z.ZodString>;
        snapshot: z.ZodOptional<z.ZodObject<{
            description: z.ZodString;
            error: z.ZodOptional<z.ZodString>;
            outputFile: z.ZodOptional<z.ZodString>;
            skipTranscript: z.ZodBoolean;
            status: z.ZodEnum<{
                completed: "completed";
                failed: "failed";
                interrupted: "interrupted";
                pending: "pending";
            }>;
            summary: z.ZodOptional<z.ZodString>;
            taskStatus: z.ZodEnum<{
                completed: "completed";
                failed: "failed";
                killed: "killed";
                paused: "paused";
                pending: "pending";
                running: "running";
                stopped: "stopped";
            }>;
            taskType: z.ZodString;
            type: z.ZodLiteral<"backgroundTask">;
            usage: z.ZodOptional<z.ZodObject<{
                durationMs: z.ZodNumber;
                toolUses: z.ZodNumber;
                totalTokens: z.ZodNumber;
            }, z.core.$strip>>;
            workflow: z.ZodOptional<z.ZodObject<{
                agents: z.ZodArray<z.ZodObject<{
                    agentType: z.ZodOptional<z.ZodString>;
                    attempt: z.ZodNumber;
                    cached: z.ZodBoolean;
                    durationMs: z.ZodOptional<z.ZodNumber>;
                    error: z.ZodOptional<z.ZodString>;
                    index: z.ZodNumber;
                    isolation: z.ZodOptional<z.ZodString>;
                    label: z.ZodString;
                    lastProgressAt: z.ZodNumber;
                    lastToolName: z.ZodOptional<z.ZodString>;
                    lastToolSummary: z.ZodOptional<z.ZodString>;
                    model: z.ZodString;
                    phaseIndex: z.ZodOptional<z.ZodNumber>;
                    phaseTitle: z.ZodOptional<z.ZodString>;
                    promptPreview: z.ZodOptional<z.ZodString>;
                    queuedAt: z.ZodOptional<z.ZodNumber>;
                    resultPreview: z.ZodOptional<z.ZodString>;
                    startedAt: z.ZodOptional<z.ZodNumber>;
                    state: z.ZodEnum<{
                        done: "done";
                        failed: "failed";
                        queued: "queued";
                        running: "running";
                        skipped: "skipped";
                    }>;
                    tokens: z.ZodOptional<z.ZodNumber>;
                    toolCalls: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>>;
                phases: z.ZodArray<z.ZodObject<{
                    index: z.ZodNumber;
                    kind: z.ZodOptional<z.ZodString>;
                    title: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
            workflowName: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        channel: z.ZodEnum<{
            assistant: "assistant";
            reasoning: "reasoning";
        }>;
        kind: z.ZodLiteral<"message.delta">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        parentRef: z.ZodOptional<z.ZodString>;
        streamKey: z.ZodString;
        text: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        channel: z.ZodEnum<{
            assistant: "assistant";
            reasoning: "reasoning";
        }>;
        detach: z.ZodOptional<z.ZodBoolean>;
        kind: z.ZodLiteral<"message.close">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        parentRef: z.ZodOptional<z.ZodString>;
        streamKey: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        channel: z.ZodEnum<{
            agentMessage: "agentMessage";
            plan: "plan";
            reasoningSummary: "reasoningSummary";
            reasoningText: "reasoningText";
        }>;
        key: z.ZodObject<{
            channel: z.ZodOptional<z.ZodString>;
            parentRef: z.ZodOptional<z.ZodString>;
            providerItemId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        kind: z.ZodLiteral<"item.textDelta">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        providerTurnId: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        channel: z.ZodEnum<{
            command: "command";
            fileChange: "fileChange";
        }>;
        key: z.ZodObject<{
            channel: z.ZodOptional<z.ZodString>;
            parentRef: z.ZodOptional<z.ZodString>;
            providerItemId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        kind: z.ZodLiteral<"item.outputDelta">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        providerTurnId: z.ZodOptional<z.ZodString>;
        text: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        key: z.ZodObject<{
            channel: z.ZodOptional<z.ZodString>;
            parentRef: z.ZodOptional<z.ZodString>;
            providerItemId: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        kind: z.ZodLiteral<"command.outputSnapshot">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        text: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"usage.turn">;
        modelContextWindow: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        tokens: z.ZodObject<{
            cachedInputTokens: z.ZodNumber;
            inputTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            reasoningOutputTokens: z.ZodNumber;
            totalTokens: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"usage.exact">;
        last: z.ZodObject<{
            cachedInputTokens: z.ZodNumber;
            inputTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            reasoningOutputTokens: z.ZodNumber;
            totalTokens: z.ZodNumber;
        }, z.core.$strip>;
        modelContextWindow: z.ZodNullable<z.ZodNumber>;
        providerTurnId: z.ZodOptional<z.ZodString>;
        total: z.ZodObject<{
            cachedInputTokens: z.ZodNumber;
            inputTokens: z.ZodNumber;
            outputTokens: z.ZodNumber;
            reasoningOutputTokens: z.ZodNumber;
            totalTokens: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        attach: z.ZodEnum<{
            currentOrLast: "currentOrLast";
            open: "open";
        }>;
        estimated: z.ZodBoolean;
        kind: z.ZodLiteral<"contextWindow">;
        size: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        used: z.ZodNullable<z.ZodNumber>;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"context.compacted">;
        noTurnFallback: z.ZodOptional<z.ZodObject<{
            raw: z.ZodObject<{
                id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
                jsonrpc: z.ZodLiteral<"2.0">;
                method: z.ZodString;
                params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
            }, z.core.$strip>;
            rawType: z.ZodString;
        }, z.core.$strip>>;
        providerTurnId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"context.cleared">;
    }, z.core.$strip>, z.ZodObject<{
        diff: z.ZodString;
        kind: z.ZodLiteral<"turn.diff">;
        providerTurnId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"thread.started">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"thread.identity">;
        providerThreadId: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"thread.name">;
        name: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"thread.goal">;
        objective: z.ZodString;
        status: z.ZodEnum<{
            active: "active";
            budgetLimited: "budgetLimited";
            complete: "complete";
            paused: "paused";
        }>;
        timeUsedSeconds: z.ZodNumber;
        tokenBudget: z.ZodNullable<z.ZodNumber>;
        tokensUsed: z.ZodNumber;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"thread.goalCleared">;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"provider.rateLimits">;
        rateLimits: z.ZodObject<{
            kind: z.ZodEnum<{
                "spend-control": "spend-control";
                "subscription-window": "subscription-window";
                credits: "credits";
                unknown: "unknown";
            }>;
            overageReason: z.ZodNullable<z.ZodString>;
            overageStatus: z.ZodNullable<z.ZodEnum<{
                allowed: "allowed";
                rejected: "rejected";
                unavailable: "unavailable";
                warning: "warning";
            }>>;
            providerId: z.ZodString;
            reachedReason: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
                allowed: "allowed";
                blocked: "blocked";
                unknown: "unknown";
                warning: "warning";
            }>;
            windows: z.ZodArray<z.ZodObject<{
                label: z.ZodNullable<z.ZodString>;
                providerKey: z.ZodNullable<z.ZodString>;
                resetsAtMs: z.ZodNullable<z.ZodNumber>;
                status: z.ZodEnum<{
                    allowed: "allowed";
                    blocked: "blocked";
                    unknown: "unknown";
                    warning: "warning";
                }>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>, z.ZodObject<{
        category: z.ZodOptional<z.ZodEnum<{
            "active-turn-not-steerable": "active-turn-not-steerable";
            "bad-request": "bad-request";
            "budget-exceeded": "budget-exceeded";
            "connection-failed": "connection-failed";
            "context-window-exceeded": "context-window-exceeded";
            "max-output-tokens": "max-output-tokens";
            "max-turns": "max-turns";
            "rate-limit": "rate-limit";
            "stream-disconnected": "stream-disconnected";
            "structured-output-retries": "structured-output-retries";
            "thread-rollback-failed": "thread-rollback-failed";
            "too-many-failed-attempts": "too-many-failed-attempts";
            billing: "billing";
            internal: "internal";
            overloaded: "overloaded";
            policy: "policy";
            sandbox: "sandbox";
            unauthorized: "unauthorized";
            unknown: "unknown";
        }>>;
        detail: z.ZodOptional<z.ZodString>;
        errorInfo: z.ZodOptional<z.ZodObject<{
            category: z.ZodEnum<{
                "active-turn-not-steerable": "active-turn-not-steerable";
                "bad-request": "bad-request";
                "budget-exceeded": "budget-exceeded";
                "connection-failed": "connection-failed";
                "context-window-exceeded": "context-window-exceeded";
                "max-output-tokens": "max-output-tokens";
                "max-turns": "max-turns";
                "rate-limit": "rate-limit";
                "stream-disconnected": "stream-disconnected";
                "structured-output-retries": "structured-output-retries";
                "thread-rollback-failed": "thread-rollback-failed";
                "too-many-failed-attempts": "too-many-failed-attempts";
                billing: "billing";
                internal: "internal";
                overloaded: "overloaded";
                policy: "policy";
                sandbox: "sandbox";
                unauthorized: "unauthorized";
                unknown: "unknown";
            }>;
            httpStatusCode: z.ZodNullable<z.ZodNumber>;
            providerCode: z.ZodNullable<z.ZodString>;
        }, z.core.$strip>>;
        kind: z.ZodLiteral<"provider.error">;
        message: z.ZodString;
        providerTurnId: z.ZodOptional<z.ZodString>;
        settlesTurn: z.ZodOptional<z.ZodBoolean>;
        threadScoped: z.ZodOptional<z.ZodBoolean>;
        willRetry: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        fallbackModel: z.ZodString;
        kind: z.ZodLiteral<"provider.modelFallback">;
        message: z.ZodString;
        originalModel: z.ZodString;
        reason: z.ZodEnum<{
            provider: "provider";
            refusal: "refusal";
        }>;
    }, z.core.$strip>, z.ZodObject<{
        category: z.ZodOptional<z.ZodEnum<{
            "compaction-skipped": "compaction-skipped";
            config: "config";
            deprecation: "deprecation";
            general: "general";
        }>>;
        details: z.ZodOptional<z.ZodString>;
        kind: z.ZodLiteral<"provider.warning">;
        summary: z.ZodOptional<z.ZodString>;
        vouchedTurn: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"unhandled">;
        onlyIfNoTurn: z.ZodOptional<z.ZodBoolean>;
        parentRef: z.ZodOptional<z.ZodString>;
        providerTurnId: z.ZodOptional<z.ZodString>;
        raw: z.ZodObject<{
            id: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
            jsonrpc: z.ZodLiteral<"2.0">;
            method: z.ZodString;
            params: z.ZodOptional<z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
        }, z.core.$strip>;
        rawType: z.ZodString;
        vouchedTurn: z.ZodBoolean;
    }, z.core.$strip>, z.ZodObject<{
        error: z.ZodOptional<z.ZodObject<{
            message: z.ZodString;
        }, z.core.$strip>>;
        kind: z.ZodLiteral<"session.ended">;
        reason: z.ZodEnum<{
            exited: "exited";
            interrupted: "interrupted";
            replaced: "replaced";
        }>;
    }, z.core.$strip>, z.ZodObject<{
        kind: z.ZodLiteral<"session.reset">;
    }, z.core.$strip>], "kind">>;
    threadId: z.ZodString;
}, z.core.$loose>;
type ThreadDeltaNotificationParams = z.infer<typeof threadDeltaNotificationParamsSchema>;

interface SanitizeInheritedChildProcessEnvArgs {
    env: NodeJS.ProcessEnv;
    /**
     * The user's login-shell PATH, substituted for the inherited one. Omit to
     * keep the parent's PATH: that is a real distinction, not a default. A
     * daemon started by launchd or systemd inherits a minimal PATH that finds
     * none of the user's tools, so anything spawning user-facing executables
     * (plugin hosts, provider bridges) passes the resolved shell PATH, while a
     * child that must run exactly what the parent runs must not.
     */
    shellPath?: string;
}
/**
 * The one answer to "what does a bb-spawned child process inherit": the
 * parent's env minus bb runtime-owned variables (`BB_*`) and `NODE_ENV`,
 * optionally with the user's login-shell PATH substituted. Callers overlay
 * only the child-specific bb env they intentionally expose afterward.
 */
declare function sanitizeInheritedChildProcessEnv(args: SanitizeInheritedChildProcessEnvArgs): NodeJS.ProcessEnv;

declare const hostDaemonAcpLaunchSpecSchema: z.ZodObject<{
    args: z.ZodArray<z.ZodString>;
    command: z.ZodString;
    cwd: z.ZodOptional<z.ZodString>;
    displayName: z.ZodString;
    env: z.ZodRecord<z.ZodString, z.ZodString>;
    modelCli: z.ZodOptional<z.ZodPipe<z.ZodObject<{
        listArgs: z.ZodArray<z.ZodString>;
        primaryModels: z.ZodArray<z.ZodString>;
        selectFlag: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>, z.ZodTransform<{
        listArgs: string[];
        primaryModels: string[];
        selectFlag?: string | undefined;
    } | undefined, {
        listArgs: string[];
        primaryModels: string[];
        selectFlag?: string | undefined;
    }>>>;
    nativeReasoning: z.ZodOptional<z.ZodObject<{
        configId: z.ZodString;
        defaultLevel: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
        levelValues: z.ZodOptional<z.ZodRecord<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }> & z.core.$partial, z.ZodString>>;
        supportedLevels: z.ZodArray<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
    }, z.core.$strict>>;
    nativeSkillRoots: z.ZodOptional<z.ZodObject<{
        project: z.ZodDefault<z.ZodArray<z.ZodString>>;
        user: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    permissionCli: z.ZodOptional<z.ZodObject<{
        full: z.ZodOptional<z.ZodArray<z.ZodString>>;
        insertAfterArgs: z.ZodOptional<z.ZodNumber>;
        readonly: z.ZodOptional<z.ZodArray<z.ZodString>>;
        workspaceWrite: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    reasoningCli: z.ZodOptional<z.ZodObject<{
        defaultLevel: z.ZodOptional<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
        flag: z.ZodString;
        levelValues: z.ZodOptional<z.ZodRecord<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }> & z.core.$partial, z.ZodString>>;
        supportedLevels: z.ZodArray<z.ZodEnum<{
            high: "high";
            low: "low";
            max: "max";
            medium: "medium";
            none: "none";
            ultra: "ultra";
            ultracode: "ultracode";
            xhigh: "xhigh";
        }>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
type HostDaemonAcpLaunchSpec = z.infer<typeof hostDaemonAcpLaunchSpecSchema>;
declare function normalizeHostDaemonAcpLaunchSpec(spec: HostDaemonAcpLaunchSpec): HostDaemonAcpLaunchSpec;

export { BRIDGE_INBOUND_REQUEST_METHODS, BRIDGE_JSON_RPC_ERRORS, BRIDGE_NOTIFICATION_METHODS, BRIDGE_REQUEST_METHODS, DEFAULT_CLAUDE_CODE_MOCK_CLI_TRAFFIC_CONFIG, DEFAULT_CLAUDE_CODE_MOCK_CLI_TRAFFIC_ENDPOINT, HIGH_REASONING_EFFORT, LOCAL_BASH_TASK_TYPE, LOCAL_WORKFLOW_TASK_TYPE, LOW_REASONING_EFFORT, MAX_REASONING_EFFORT, MEDIUM_REASONING_EFFORT, PROVIDER_BRIDGE_EXPORT_NAME, PROVIDER_BRIDGE_PROTOCOL_VERSION, ProviderRequestDecodeError, ProviderResponseEncodeError, THREAD_DELTA_NOTIFICATION_METHOD, ULTRACODE_REASONING_EFFORT, USER_QUESTION_MAX_OPTIONS, USER_QUESTION_MAX_QUESTIONS, XHIGH_REASONING_EFFORT, acpNativeReasoningSchema, acpPermissionCliSchema, acpReasoningCliSchema, backgroundTaskItemStatus, bashArgsSchema, bridgeRequestEnvelopeSchema, buildShellEnvOverrides, claudeCodeMockCliTrafficConfigSchema, claudeTaskToolNameSchema, claudeTaskToolOutputSchema, createBridgeIo, createBridgeLineHandler, createPendingToolCallTracker, createProviderVisibilityMetadata, decodeBridgeJsonRpcResponse, decodeToolCallResponsePayload, deltaBackgroundTaskShapeSchema, deltaFileChangeSchema, deltaItemKeySchema, deltaItemShapeSchema, deltaMessageChannelSchema, deltaNoTurnFallbackSchema, deltaOutputChannelSchema, deltaTextChannelSchema, dynamicToolSchema, errorEnvelopeSchema, experimental_defineProviderBridge, extractResultText, getRawSdkMessage, getRecordProperty, getStringProperty, hostDaemonAcpLaunchSpecSchema, initializeParamsSchema, instructionModeValues, isApprovalPendingInteractionPayload, isApprovalPendingInteractionResolution, isBackgroundAgentTaskType, isClaudeCodeMockCliTrafficEndpoint, isRecord, isSettledBackgroundTaskStatus, isStandaloneBuiltinCompactCommand, isUserQuestionPendingInteractionPayload, isUserQuestionPendingInteractionResolution, jsonRpcEnvelopeSchema, jsonValueSchema, mimeTypeFromExtension, modelListParamsSchema, normalizeHostDaemonAcpLaunchSpec, normalizeProviderCommandOutput, pendingInteractionCommandActionSchema, pendingInteractionFileSystemPermissionsSchema, pendingInteractionMacOsPermissionsSchema, pendingInteractionNetworkPermissionsSchema, pendingInteractionRequestedPermissionProfileSchema, pendingInteractionResolutionSchema, permissionEscalationValues, providerRawEventSchema, reasoningEffortsForLevels, reasoningLevelSchema, reasoningLevelValues, removeCommandMentionsFromPromptInput, runBridgeRequest, runtimePermissionScopeValues, sanitizeInheritedChildProcessEnv, sdkMessageEnvelopeSchema, shouldAutoDenyInteractiveRequest, skillsConfigureParamsSchema, textBlockSchema, threadArchiveParamsSchema, threadContextWindowUsageEnvelopeSchema, threadDeltaNotificationParamsSchema, threadDeltaSchema, threadDiscardParamsSchema, threadForkParamsSchema, threadGoalClearParamsSchema, threadIdentityEnvelopeSchema, threadNameSetParamsSchema, threadResumeParamsSchema, threadStartParamsSchema, threadStopParamsSchema, threadUnarchiveParamsSchema, toNonNegativeNumber, toOptionalRecord, toOptionalString, toPositiveNumber, turnStartParamsSchema, turnSteerParamsSchema, withoutBridgeRuntimeEnv };
export type { ApprovalPendingInteractionPayload, AvailableModel, BackgroundTaskStatus, BackgroundTaskUsage, BridgeExecutionOptions, BridgeJsonRpcResponse, BridgeToolCallRequest, BuildInteractiveResponseArgs, ClaudeCodeMockCliTrafficConfig, ClaudeTaskToolOutput, ClientTurnRequestId, DecodedInteractiveRequest, DeltaBackgroundTaskShape, DeltaFileChange, DeltaItemKey, DeltaItemShape, DeltaMessageChannel, DeltaNoTurnFallback, DeltaOutputChannel, DeltaTextChannel, DynamicTool, HostDaemonAcpLaunchSpec, InitializeResult, InstructionMode, JsonObject, JsonRpcMessage, JsonValue, ModelReasoningEffort, PendingInteractionApprovalDecision, PendingInteractionApprovalSubject, PendingInteractionCommandAction, PendingInteractionGrantablePermissionProfile, PendingInteractionGrantedPermissionProfile, PendingInteractionPayload, PendingInteractionRequestedPermissionProfile, PendingInteractionResolution, PendingInteractionUserQuestionQuestion, PermissionEscalation, PermissionMode, PreparedProviderCommandDispatch, PromptInput, ProviderBridgeContext, ProviderBridgeDefinition, ProviderBridgeEntry, ProviderErrorCategory, ProviderErrorInfo, ProviderInboundRequest, ProviderPostInitializeRequest, ProviderRateLimitState, ProviderRateLimitStatus, ProviderRateLimitWindow, ProviderRawEvent, ProviderRawEventCoverage, ProviderRawEventDescription, ProviderRuntimeEvent, ProviderVisibilityMetadata, ReasoningLevel, RuntimePermissionPolicy, RuntimePermissionScope, ServiceTier, ThreadDelta, ThreadDeltaKind, ThreadDeltaNotificationParams, ThreadEventContextWindowUsage, ThreadEventItemStatus, ThreadEventPlanStep, ThreadEventTokenUsageBreakdown, ThreadEventTurnStatus, ThreadEventUserContent, UserQuestionPendingInteractionPayload, UserQuestionPendingInteractionResolution, WorkflowAgentSnapshot, WorkflowAgentState, WorkflowPhaseSnapshot, WorkflowProgressSnapshot };
