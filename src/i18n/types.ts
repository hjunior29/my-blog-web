export type Locale = 'pt' | 'en'

export interface ArticleSample {
  readonly title: string
  readonly description: string
  readonly category: string
}

export interface NotebookEntry {
  readonly title: string
  readonly body: string
}

export interface AboutPillar {
  readonly title: string
  readonly badge: string
  readonly description: string
}

export interface AboutExperienceItem {
  readonly role: string
  readonly period: string
  readonly detail: string
}

export interface AboutEducationItem {
  readonly degree: string
  readonly institution: string
  readonly period: string
  readonly detail: string
}

export interface Copy {
  readonly brandName: string
  readonly navMain: string
  readonly navArticles: string
  readonly navAbout: string
  readonly navStudio: string
  readonly switchLocale: string
  readonly lightTheme: string
  readonly darkTheme: string
  readonly skipToContent: string

  readonly heroTitle: string
  readonly heroSubtitle: string
  readonly heroCta: string
  readonly recentArticlesTitle: string
  readonly allArticlesLink: string
  readonly recentArticlesSubtitle: string
  readonly topicsTitle: string
  readonly topicsSubtitle: string
  readonly aboutBriefTitle: string
  readonly aboutBriefBody: string
  readonly aboutReadMore: string
  readonly closingSubtitle: string
  readonly heroScrollCue: string
  readonly notebookLabel: string
  readonly notebookKicker: string
  readonly notebookTitle: string
  readonly notebookLead: string
  readonly notebookTopicsTitle: string
  readonly notebookTopics: readonly NotebookEntry[]
  readonly notebookStackTitle: string
  readonly notebookStack: string
  readonly notebookRulesTitle: string
  readonly notebookRules: readonly string[]
  readonly letterEyebrow: string
  readonly letterHeading: string
  readonly letterLabel: string
  readonly letterRecipientLabel: string
  readonly letterRecipient: string
  readonly letterSender: string
  readonly letterPostmark: string
  readonly letterFoldedLabel: string
  readonly letterGreeting: string
  readonly letterBody: readonly string[]
  readonly letterClosing: string
  readonly letterSignature: string
  readonly letterPostscript: string

  readonly searchPlaceholder: string
  readonly searchLabel: string
  readonly searchClear: string
  readonly searchResultsCount: (count: number) => string
  readonly noResultsTitle: string
  readonly noResultsDescription: string
  readonly resetSearch: string

  readonly backToArticles: string
  readonly tableOfContents: string
  readonly expandDiagram: string
  readonly zoomIn: string
  readonly zoomOut: string
  readonly resetZoom: string
  readonly diagramPanHint: string
  readonly shareArticle: string
  readonly shareViaWebShare: string
  readonly copyArticleLink: string
  readonly linkCopied: string
  readonly linkCopyFailed: string
  readonly printArticle: string
  readonly relatedArticlesTitle: string
  readonly articleNotFoundTitle: string
  readonly articleNotFoundBody: string

  readonly aboutPageEyebrow: string
  readonly aboutPageTitle: string
  readonly aboutPageIntro: string
  readonly aboutPageBio: string
  readonly aboutPageBioExtended: string
  readonly aboutPillarsTitle: string
  readonly aboutPillars: readonly AboutPillar[]
  readonly aboutExperienceTitle: string
  readonly aboutExperienceItems: readonly AboutExperienceItem[]
  readonly aboutEducationTitle: string
  readonly aboutEducationItems: readonly AboutEducationItem[]
  readonly aboutPageColophonTitle: string
  readonly aboutPageColophon: string
  readonly aboutContactTitle: string
  readonly aboutContactSubtitle: string
  readonly contactGithub: string
  readonly contactLinkedin: string
  readonly contactEmail: string

  readonly studioAccessTitle: string
  readonly studioAccessSubtitle: string
  readonly studioEmailLabel: string
  readonly studioEmailPlaceholder: string
  readonly passwordLabel: string
  readonly showPassword: string
  readonly hidePassword: string
  readonly signInButton: string
  readonly signingInButton: string
  readonly rememberMe: string
  readonly loginFailedGeneric: string
  readonly unauthorizedTitle: string
  readonly unauthorizedDescription: string

  readonly twoFactorTitle: string
  readonly twoFactorSubtitle: string
  readonly otpLabel: string
  readonly otpPlaceholder: string
  readonly verifyCodeButton: string
  readonly verifyingCodeButton: string
  readonly resendCodeButton: string
  readonly resendCooldown: (seconds: number) => string
  readonly codeResentSuccess: string
  readonly backToLogin: string
  readonly invalidOtp: string

  readonly studioPostsTitle: string
  readonly newPostButton: string
  readonly statusAll: string
  readonly statusDraft: string
  readonly statusPublished: string
  readonly statusScheduled: string
  readonly statusArchived: string
  readonly tableHeaderTitle: string
  readonly tableHeaderStatus: string
  readonly tableHeaderTags: string
  readonly tableHeaderUpdated: string
  readonly tableHeaderActions: string
  readonly editAction: string
  readonly deleteAction: string
  readonly deleteConfirmTitle: string
  readonly deleteConfirmMessage: (title: string) => string
  readonly deleteConfirmButton: string
  readonly cancelAction: string
  readonly postDeletedSuccess: string

  readonly editorNewTitle: string
  readonly editorEditTitle: string
  readonly postTitleLabel: string
  readonly postTitlePlaceholder: string
  readonly postSummaryLabel: string
  readonly postSummaryPlaceholder: string
  readonly postContentLabel: string
  readonly postContentPlaceholder: string
  readonly postTagsLabel: string
  readonly postTagsPlaceholder: string
  readonly bookColorLabel: string
  readonly bookColorAuto: string
  readonly tabEdit: string
  readonly tabPreview: string
  readonly savePublishedButton: string
  readonly saveDraftButton: string
  readonly publishButton: string
  readonly publishNewVersionButton: string
  readonly discardDraftButton: string
  readonly discardDraftConfirm: string
  readonly discardDraftDialogTitle: string
  readonly discardDraftDialogMessage: string
  readonly discardDraftConfirmButton: string
  readonly draftDiscardedSuccess: string
  readonly hasDraftBadge: string
  readonly unpublishButton: string
  readonly savingButton: string
  readonly conflictTitle: string
  readonly conflictMessage: string
  readonly conflictResolveLocal: string
  readonly conflictResolveRemote: string
  readonly exportMarkdownButton: string
  readonly importMarkdownButton: string
  readonly markdownImportedSuccess: string
  readonly titleRequiredError: string
  readonly draftCreatedSuccess: string
  readonly draftUpdatedSuccess: string
  readonly archiveButton: string
  readonly unarchiveButton: string
  readonly articlePublishedSuccess: string
  readonly articleUnpublishedSuccess: string
  readonly articleArchivedSuccess: string
  readonly articleUnarchivedSuccess: string
  readonly autosaveSaved: string
  readonly autosaveSaving: string
  readonly autosavePaused: string
  readonly autosaveActive: string
  readonly autosaveUnsaved: string
  readonly coverImageLabel: string
  readonly coverImagePlaceholder: string
  readonly clearCoverButton: string
  readonly uploadCoverButton: string
  readonly coverPreviewTitle: string
  readonly coverPreviewAria: string
  readonly uploadMediaButton: string
  readonly uploadingMedia: string
  readonly mediaUploadedSuccess: string
  readonly mediaUploadFailed: string
  readonly insertMediaDialogTitle: string
  readonly viewModeSplit: string
  readonly viewModeEditor: string
  readonly viewModePreview: string
  readonly backToPostsAction: string

  readonly studioAccountTitle: string
  readonly displayNameLabel: string
  readonly bioLabel: string
  readonly saveProfileButton: string
  readonly profileSavedSuccess: string
  readonly displayNameRequiredError: string
  readonly changePasswordTitle: string
  readonly currentPasswordLabel: string
  readonly newPasswordLabel: string
  readonly confirmPasswordLabel: string
  readonly updatePasswordButton: string
  readonly passwordUpdatedSuccess: string
  readonly currentPasswordRequiredError: string
  readonly newPasswordMinLengthError: string
  readonly passwordsDoNotMatchError: string
  readonly activeSessionsTitle: string
  readonly currentSessionBadge: string
  readonly revokeSessionButton: string
  readonly revokeAllSessionsButton: string
  readonly sessionRevokedSuccess: string
  readonly unknownDeviceFallback: string
  readonly logoutButton: string

  readonly pauseAnimations: string
  readonly resumeAnimations: string
  readonly loadingMessage: string
  readonly genericErrorMessage: string
  readonly retryAction: string
  readonly emptyStateMessage: string
  readonly paginationPrevious: string
  readonly paginationNext: string
  readonly paginationPage: (current: number, total: number) => string

  readonly motionTitle: string
  readonly motionDescription: string
  readonly motionModal: string
  readonly motionToast: string
  readonly articleGridTitle: string
  readonly articleSamples: readonly ArticleSample[]
  readonly articleIntro: string
  readonly articleContinuation: string
  readonly iconTitle: string
  readonly iconDescription: string
  readonly postCoverImage: string
  readonly bookTitle: string
  readonly bookDescription: string
  readonly bookRotate: string
  readonly bookTexture: string
  readonly bookReference: string
  readonly bookReferenceTitle: string
  readonly bookStripe: string
  readonly bookSimple: string
  readonly bookPersonal: string
  readonly bookPersonalTitle: string
  readonly bookPersonalCaption: string
  readonly bookNote: string
  readonly title: string
  readonly intro: string
  readonly system: string
  readonly edition: string
  readonly overview: string
  readonly foundations: string
  readonly components: string
  readonly editorial: string
  readonly feedback: string
  readonly principles: string
  readonly explore: string
  readonly preview: string
  readonly version: string
  readonly crafted: string
  readonly index: string
  readonly light: string
  readonly dark: string
  readonly skip: string
  readonly note: string
  readonly noteBody: string
  readonly foundationDesc: string
  readonly colors: string
  readonly colorHelp: string
  readonly colorNames: readonly string[]
  readonly copied: string
  readonly copyFailed: string
  readonly typography: string
  readonly typeTitle: string
  readonly typeBody: string
  readonly display: string
  readonly body: string
  readonly mono: string
  readonly scaleLabels: readonly string[]
  readonly scale: string
  readonly spacing: string
  readonly spacingBody: string
  readonly componentDesc: string
  readonly buttons: string
  readonly primary: string
  readonly secondary: string
  readonly tertiary: string
  readonly disabled: string
  readonly loading: string
  readonly save: string
  readonly saved: string
  readonly small: string
  readonly regular: string
  readonly large: string
  readonly fields: string
  readonly email: string
  readonly emailPlaceholder: string
  readonly emailHelp: string
  readonly invalid: string
  readonly subscribe: string
  readonly subscribed: string
  readonly subject: string
  readonly subjects: readonly string[]
  readonly message: string
  readonly messagePlaceholder: string
  readonly notifications: string
  readonly reading: string
  readonly tags: string
  readonly all: string
  readonly navigation: string
  readonly previous: string
  readonly next: string
  readonly page: string
  readonly editorialDesc: string
  readonly example: string
  readonly featured: string
  readonly articleTitle: string
  readonly articleBody: string
  readonly readTime: string
  readonly date: string
  readonly author: string
  readonly authorRole: string
  readonly project: string
  readonly projectTitle: string
  readonly projectBody: string
  readonly projectLink: string
  readonly quote: string
  readonly quoteCaption: string
  readonly articlePreview: string
  readonly close: string
  readonly feedbackDesc: string
  readonly success: string
  readonly successBody: string
  readonly error: string
  readonly errorBody: string
  readonly retry: string
  readonly recovered: string
  readonly empty: string
  readonly emptyBody: string
  readonly reset: string
  readonly skeleton: string
  readonly toast: string
  readonly showToast: string
  readonly accordion: string
  readonly accordionBody: string
  readonly principlesDesc: string
  readonly principleTitles: readonly string[]
  readonly principleBodies: readonly string[]
  readonly footer: string
  readonly demoAction: string
  readonly token: string
}
