import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // ─── User Profile ───────────────────────────────────────────────────────────
  UserProfile: a
    .model({
      authUserId: a.string().required(),
      fullName: a.string().required(),
      email: a.email().required(),
      username: a.string().required(),
      role: a.enum(['ADMIN', 'FREELANCER', 'PUBLIC']),
      status: a.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
      profileImage: a.string(),
      bio: a.string(),
      lastLoginAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner().to(['read', 'update']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Category ───────────────────────────────────────────────────────────────
  Category: a
    .model({
      name: a.string().required(),
      description: a.string(),
      type: a.enum(['COURSE', 'EXAM', 'PROJECT', 'GENERAL']),
      isActive: a.boolean().default(true),
      color: a.string(),
      icon: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Media Asset ────────────────────────────────────────────────────────────
  MediaAsset: a
    .model({
      title: a.string().required(),
      description: a.string(),
      mediaType: a.enum(['IMAGE', 'VIDEO']),
      storageKey: a.string().required(),
      url: a.string(),
      folderType: a.enum([
        'HOME_IMAGE',
        'HOME_VIDEO',
        'COURSE_VIDEO',
        'COURSE_THUMBNAIL',
        'PROJECT_FILE',
        'PROFILE_IMAGE',
      ]),
      categoryId: a.string(),
      uploadedBy: a.string(),
      visibility: a.enum(['PUBLIC', 'PRIVATE']),
      duration: a.integer(),
      fileSize: a.integer(),
      mimeType: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Playlist ────────────────────────────────────────────────────────────────
  Playlist: a
    .model({
      title: a.string().required(),
      description: a.string(),
      categoryId: a.string(),
      thumbnail: a.string(),
      isPublished: a.boolean().default(false),
      visibility: a.enum(['PUBLIC', 'FREELANCER_ONLY']),
      orderIndex: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Course Video ────────────────────────────────────────────────────────────
  CourseVideo: a
    .model({
      playlistId: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      videoStorageKey: a.string().required(),
      thumbnailStorageKey: a.string(),
      duration: a.integer(),
      orderIndex: a.integer().default(0),
      visibility: a.enum(['PUBLIC', 'FREELANCER_ONLY']),
      isPublished: a.boolean().default(false),
      views: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Video Comment ───────────────────────────────────────────────────────────
  VideoComment: a
    .model({
      videoId: a.string().required(),
      authorId: a.string().required(),
      authorName: a.string().required(),
      content: a.string().required(),
      parentCommentId: a.string(),
      isDeleted: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner(),
      allow.authenticated().to(['read', 'create']),
    ]),

  // ─── Course Progress ─────────────────────────────────────────────────────────
  CourseProgress: a
    .model({
      userId: a.string().required(),
      playlistId: a.string().required(),
      videoId: a.string().required(),
      progressPercentage: a.float().default(0),
      completed: a.boolean().default(false),
      lastWatchedAt: a.datetime(),
      watchTimeSeconds: a.integer().default(0),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner(),
    ]),

  // ─── Exam Category ───────────────────────────────────────────────────────────
  ExamCategory: a
    .model({
      name: a.string().required(),
      description: a.string(),
      isActive: a.boolean().default(true),
      relatedCourseCategoryId: a.string(),
      passingScore: a.integer().default(70),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Exam Session ────────────────────────────────────────────────────────────
  ExamSession: a
    .model({
      examCategoryId: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      scheduledDate: a.datetime(),
      duration: a.integer(),
      location: a.string(),
      maxParticipants: a.integer(),
      status: a.enum([
        'OPEN',
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ]),
      createdBy: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.authenticated().to(['read']),
    ]),

  // ─── Exam Attempt ────────────────────────────────────────────────────────────
  ExamAttempt: a
    .model({
      userId: a.string().required(),
      examSessionId: a.string(),
      examCategoryId: a.string().required(),
      status: a.enum([
        'REQUESTED',
        'SCHEDULED',
        'COMPLETED',
        'UNDER_REVIEW',
        'PASSED',
        'FAILED',
        'CANCELLED',
      ]),
      score: a.float(),
      adminNotes: a.string(),
      requestedAt: a.datetime(),
      scheduledAt: a.datetime(),
      completedAt: a.datetime(),
      reviewedAt: a.datetime(),
      reviewedBy: a.string(),
      attemptNumber: a.integer().default(1),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner(),
    ]),

  // ─── Project ─────────────────────────────────────────────────────────────────
  Project: a
    .model({
      name: a.string().required(),
      categoryId: a.string().required(),
      price: a.float().required(),
      publicDescription: a.string().required(),
      privateInstructions: a.string(),
      requiredExamCategoryId: a.string().required(),
      status: a.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
      difficulty: a.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
      deadline: a.datetime(),
      createdBy: a.string(),
      tags: a.string().array(),
      attachments: a.string().array(),
      maxAssignees: a.integer().default(1),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.guest().to(['read']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Project Assignment ───────────────────────────────────────────────────────
  ProjectAssignment: a
    .model({
      projectId: a.string().required(),
      freelancerId: a.string().required(),
      assignedBy: a.string().required(),
      status: a.enum([
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'UNDER_VERIFICATION',
        'REVISION_REQUESTED',
        'APPROVED',
        'REJECTED',
      ]),
      assignedAt: a.datetime(),
      openedAt: a.datetime(),
      completedAt: a.datetime(),
      verificationStartedAt: a.datetime(),
      reviewedAt: a.datetime(),
      gradePercentage: a.float(),
      adminFeedback: a.string(),
      revisionNotes: a.string(),
      submissionNotes: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner().to(['read', 'update']),
    ]),

  // ─── Project Request ──────────────────────────────────────────────────────────
  ProjectRequest: a
    .model({
      projectId: a.string().required(),
      freelancerId: a.string().required(),
      freelancerName: a.string().required(),
      status: a.enum(['PENDING', 'APPROVED', 'REJECTED']),
      requestedAt: a.datetime(),
      reviewedAt: a.datetime(),
      reviewedBy: a.string(),
      message: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner(),
    ]),

  // ─── Performance Record ───────────────────────────────────────────────────────
  PerformanceRecord: a
    .model({
      userId: a.string().required(),
      completedProjects: a.integer().default(0),
      rejectedProjects: a.integer().default(0),
      averageGrade: a.float().default(0),
      passedExams: a.integer().default(0),
      failedExams: a.integer().default(0),
      loyaltyPoints: a.integer().default(0),
      loyaltyLevel: a.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'ELITE']),
      certifiedCategories: a.string().array(),
      totalProjectValue: a.float().default(0),
      activeStreak: a.integer().default(0),
      lastUpdatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner().to(['read']),
    ]),

  // ─── Loyalty Transaction ──────────────────────────────────────────────────────
  LoyaltyTransaction: a
    .model({
      userId: a.string().required(),
      points: a.integer().required(),
      reason: a.string().required(),
      type: a.enum(['EARNED', 'DEDUCTED', 'MANUAL']),
      relatedProjectId: a.string(),
      relatedExamAttemptId: a.string(),
      createdBy: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner().to(['read']),
    ]),

  // ─── Chat Message ─────────────────────────────────────────────────────────────
  ChatMessage: a
    .model({
      senderId: a.string().required(),
      senderName: a.string().required(),
      senderRole: a.string().required(),
      receiverId: a.string().required(),
      content: a.string().required(),
      isRead: a.boolean().default(false),
      attachmentUrl: a.string(),
      parentMessageId: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner(),
      allow.authenticated().to(['create']),
    ]),

  // ─── Notification ─────────────────────────────────────────────────────────────
  Notification: a
    .model({
      userId: a.string().required(),
      title: a.string().required(),
      message: a.string().required(),
      type: a.enum([
        'PROJECT_ASSIGNED',
        'PROJECT_REVIEWED',
        'EXAM_SCHEDULED',
        'EXAM_RESULT',
        'MESSAGE_RECEIVED',
        'GENERAL',
        'LOYALTY_UPDATE',
      ]),
      isRead: a.boolean().default(false),
      relatedId: a.string(),
      actionUrl: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin'),
      allow.owner(),
    ]),

  // ─── Audit Log ───────────────────────────────────────────────────────────────
  AuditLog: a
    .model({
      actorUserId: a.string().required(),
      actorName: a.string().required(),
      action: a.string().required(),
      entityType: a.string().required(),
      entityId: a.string(),
      details: a.string(),
      ipAddress: a.string(),
    })
    .authorization((allow) => [allow.group('Admin')]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

