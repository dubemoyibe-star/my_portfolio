-- CreateTable
CREATE TABLE "tech_stack_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "url" TEXT,
    "proficiency" TEXT,
    "yearsOfExperience" INTEGER,
    "since" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tech_stack_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "linksRepo" TEXT,
    "linksLive" TEXT,
    "linksDemo" TEXT,
    "linksCaseStudy" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "client" TEXT,
    "includeInResume" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_tech" (
    "projectId" TEXT NOT NULL,
    "techId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "project_tech_pkey" PRIMARY KEY ("projectId","techId")
);

-- CreateTable
CREATE TABLE "project_images" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "caption" TEXT,

    CONSTRAINT "project_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "companyUrl" TEXT,
    "role" TEXT NOT NULL,
    "employmentType" TEXT,
    "location" TEXT,
    "workMode" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "description" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "includeInResume" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_tech" (
    "experienceId" TEXT NOT NULL,
    "techId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "experience_tech_pkey" PRIMARY KEY ("experienceId","techId")
);

-- CreateTable
CREATE TABLE "contributions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "owner" TEXT,
    "repoUrl" TEXT NOT NULL,
    "repoDescription" TEXT NOT NULL,
    "contributionSummary" TEXT NOT NULL,
    "contributionDetails" TEXT NOT NULL,
    "tech" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mergedDate" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "includeInResume" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,

    CONSTRAINT "contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pr_links" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "pr_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "fieldOfStudy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "credentialUrl" TEXT NOT NULL,
    "dateEarned" TEXT NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL DEFAULT 'profile',
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "bioShort" TEXT NOT NULL,
    "bioLong" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "location" TEXT,
    "availableForWork" BOOLEAN NOT NULL DEFAULT false,
    "avatarSrc" TEXT,
    "avatarAlt" TEXT,
    "avatarWidth" INTEGER,
    "avatarHeight" INTEGER,
    "avatarCaption" TEXT,
    "avatarCompactSrc" TEXT,
    "avatarCompactAlt" TEXT,
    "avatarCompactWidth" INTEGER,
    "avatarCompactHeight" INTEGER,
    "avatarCompactCaption" TEXT,
    "resumeTitle" TEXT NOT NULL,
    "resumeSummary" TEXT NOT NULL,
    "resumeFileName" TEXT NOT NULL,
    "resumeLocation" TEXT,
    "resumePhone" TEXT,
    "resumeUpdatedAt" TEXT NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_links" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT,
    "handle" TEXT,
    "primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "contact_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "educationNote" TEXT NOT NULL,
    "certificatesUrl" TEXT NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tech_stack_items_category_idx" ON "tech_stack_items"("category");

-- CreateIndex
CREATE INDEX "tech_stack_items_featured_idx" ON "tech_stack_items"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_featured_idx" ON "projects"("featured");

-- CreateIndex
CREATE INDEX "projects_includeInResume_idx" ON "projects"("includeInResume");

-- CreateIndex
CREATE INDEX "project_tech_techId_idx" ON "project_tech"("techId");

-- CreateIndex
CREATE UNIQUE INDEX "project_images_projectId_position_key" ON "project_images"("projectId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "experiences_slug_key" ON "experiences"("slug");

-- CreateIndex
CREATE INDEX "experiences_includeInResume_idx" ON "experiences"("includeInResume");

-- CreateIndex
CREATE INDEX "experience_tech_techId_idx" ON "experience_tech"("techId");

-- CreateIndex
CREATE UNIQUE INDEX "contributions_slug_key" ON "contributions"("slug");

-- CreateIndex
CREATE INDEX "contributions_featured_idx" ON "contributions"("featured");

-- CreateIndex
CREATE INDEX "contributions_includeInResume_idx" ON "contributions"("includeInResume");

-- CreateIndex
CREATE INDEX "pr_links_url_idx" ON "pr_links"("url");

-- CreateIndex
CREATE UNIQUE INDEX "pr_links_contributionId_position_key" ON "pr_links"("contributionId", "position");

-- CreateIndex
CREATE INDEX "certifications_dateEarned_idx" ON "certifications"("dateEarned");

-- CreateIndex
CREATE UNIQUE INDEX "contact_links_profileId_position_key" ON "contact_links"("profileId", "position");

-- AddForeignKey
ALTER TABLE "project_tech" ADD CONSTRAINT "project_tech_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_tech" ADD CONSTRAINT "project_tech_techId_fkey" FOREIGN KEY ("techId") REFERENCES "tech_stack_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_tech" ADD CONSTRAINT "experience_tech_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_tech" ADD CONSTRAINT "experience_tech_techId_fkey" FOREIGN KEY ("techId") REFERENCES "tech_stack_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pr_links" ADD CONSTRAINT "pr_links_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "contributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_links" ADD CONSTRAINT "contact_links_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
