# Mautic-Nest: Full-Stack Marketing Automation Platform

**Stack:** NestJS 11 + Next.js 16 + PostgreSQL + Mastra AI Agents
**Status:** Research & Plan Phase
**Repo:** To be created

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Domain Model from Mautic Research](#2-domain-model)
3. [NestJS Backend Architecture](#3-nestjs-backend)
4. [Next.js Frontend Architecture](#4-nextjs-frontend)
5. [AI Agent System (Mastra)](#5-ai-agent-system)
6. [Implementation Phases](#6-implementation-phases)
7. [File Structure](#7-file-structure)
8. [Database Schema Design](#8-database-schema)

---

## 1. Project Overview

This is a ground-up rewrite of the Mautic marketing automation platform (currently PHP/Symfony) in modern TypeScript with NestJS backend and Next.js frontend, augmented with AI agents for intelligent campaign automation.

### What Mautic Does (copied)

Mautic is the world's largest open-source marketing automation platform. It provides:

- Contact management with custom fields, scoring, and lifecycle stages
- Dynamic contact segmentation (static + dynamic lists)
- Multi-channel campaigns (email, SMS, web notifications, social)
- Visual campaign builder with decisions, conditions, and actions
- Email marketing (broadcast + drip sequences) with drag-and-drop builder
- Landing pages and forms with drag-and-drop builder
- Lead scoring and progressive profiling
- Dynamic content personalization
- Multi-channel analytics and attribution dashboards
- Webhook system for real-time integrations
- REST API for external integrations
- Plugin/bundle system for extensibility

### Core Mautic Bundles (app/bundles/ - 25 core bundles)

| Bundle | Domain |
|--------|--------|
| CoreBundle | Foundation: config, events, helpers, translations |
| LeadBundle | Contacts, companies, segments, points, stages |
| CampaignBundle | Campaign engine, events, triggers, decisions |
| EmailBundle | Email creation, sending, stats, templates |
| FormBundle | Form builder, submissions, actions |
| PageBundle | Landing pages, tracking, hits |
| AssetBundle | File downloads, tracking |
| ReportBundle | Custom reports, data aggregation |
| DashboardBundle | Dashboard widgets, KPIs |
| ChannelBundle | Multi-channel message management |
| DynamicContentBundle | Personalization engine |
| NotificationBundle | Web notifications |
| SmsBundle | SMS messaging |
| WebhookBundle | Webhook management |
| ApiBundle | REST API infrastructure |
| PointBundle | Point/score actions and triggers |
| StageBundle | Contact lifecycle stages |
| ConfigBundle | System configuration |
| CategoryBundle | Entity categorization |
| UserBundle | User management, roles, permissions |
| QueueBundle | Async processing queue |
| StatsBundle | Statistics aggregation |
| InstallBundle | Installation wizard |
| IntegrationsBundle | Third-party integration framework |
| MarketplaceBundle | Plugin marketplace |
| PluginBundle | Plugin management |

### Optional Plugins (plugins/ - 12 maintained)

GrapesJsBuilder, Clearbit, CloudStorage, CRM (Salesforce/Sugar), EmailMarketing (Mailchimp, ConstantContact), Focus items (popups), FullContact enrichment, Gmail/Outlook integrations, Social (Twitter monitoring), TagManager, Zapier

---

## 2. Domain Model

### Core Entities

```typescript
// === Contacts (LeadBundle) ===
Contact {
  id: string (uuid)
  // Custom fields stored as JSONB (dynamic schema)
  fields: Record<string, any>
  // System fields
  ownerId: string (User)
  points: number
  lastActive: Date
  dateIdentified: Date
  color: string  // from point triggers
  ipAddresses: string[]
  tags: Tag[]
  utmTags: UTM[]
  doNotContact: DNC[]
  companies: Company[]
  segments: Segment[]
  stageId: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

Company {
  id: string (uuid)
  name: string
  // Custom fields stored as JSONB
  fields: Record<string, any>
  contacts: Contact[]
  ownerId: string (User)
  createdAt: Date
  updatedAt: Date
}

// === Segmentation (LeadBundle) ===
Segment {
  id: string (uuid)
  name: string
  type: 'static' | 'dynamic'
  description: string
  // For dynamic segments
  filters: SegmentFilter[]
  // Membership
  contactCount: number
  contacts: Contact[]
  createdAt: Date
  updatedAt: Date
}

SegmentFilter {
  field: string       // contact field alias
  operator: '=' | '!=' | '>' | '<' | 'in' | 'not in' | 'between' | 'like' | 'regexp'
  value: any
  glue: 'and' | 'or'  // for chaining
}

// === Campaigns (CampaignBundle) ===
Campaign {
  id: string (uuid)
  name: string
  description: string
  canvasSettings: CanvasSettings  // Visual builder layout
  events: CampaignEvent[]
  contacts: Contact[]
  contactCount: number
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

CampaignEvent {
  id: string (uuid)
  campaignId: string
  type: 'decision' | 'condition' | 'action'
  eventType: string
    // Decisions: page.hit, form.submit, email.open, email.click
    // Conditions: field.value, segment.membership, point.score
    // Actions: email.send, email.send.to.contact, campaign.add,
    //   campaign.remove, stage.change, point.change, notification.send,
    //   sms.send, lead.update, lead.field.update, create.company,
    //   update.company, asset.download, action.add, action.remove,
    //   tag.add, tag.remove, jump.to.step, integration.action
  name: string
  triggerMode: 'immediate' | 'date' | 'interval' | 'dripfeed' | 'campaign_action'
  triggerDate: Date  // for date mode
  triggerInterval: number  // for interval mode
  triggerIntervalUnit: 'd' | 'h' | 'i' | 'm'
  triggerHour: number  // for time-restricted
  triggerRestrictedStartHour: number
  triggerRestrictedEndHour: number
  triggerRestrictedDaysOfWeek: string  // '0,1,2,3,4,5,6'
  properties: Record<string, any>  // event-specific config
  position: { x: number, y: number }  // canvas position
  children: CampaignEvent[]  // connected events in DAG
  parentId: string
  decisionPath: 'yes' | 'no'  // which branch this follows
  order: number
  createdAt: Date
}

CanvasSettings {
  nodes: CanvasNode[]
  connections: CanvasConnection[]
}

// === Email (EmailBundle) ===
Email {
  id: string (uuid)
  name: string
  subject: string
  body: string  // HTML template
  plainText: string
  template: 'builtin' | 'custom' | 'theme'
  assetId: string
  variantSettings: VariantSettings  // A/B testing
  stats: EmailStats
  list: Segment  // target segment
  type: 'template' | 'list'
  headers: Record<string, string>
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

EmailStats {
  sentCount: number
  openCount: number
  clickCount: number
  bounceCount: number
  unsubscribeCount: number
  openRate: number
  clickRate: number
  lastSent: Date
}

// === Forms (FormBundle) ===
Form {
  id: string (uuid)
  name: string
  description: string
  fields: FormField[]
  actions: FormAction[]  // post-submit actions
  kiosk: boolean          // allow multiple submissions
  captureLead: boolean    // create/update contact
  template: string
  isPublished: boolean
  submissions: FormSubmission[]
  submissionCount: number
  createdAt: Date
  updatedAt: Date
}

FormField {
  id: string (uuid)
  formId: string
  label: string
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'select' | 'multiselect'
    | 'checkbox' | 'radio' | 'date' | 'time' | 'country' | 'region'
    | 'timezone' | 'locale' | 'hidden' | 'password' | 'file'
  alias: string  // maps to contact field
  properties: {
    placeholder?: string
    helpText?: string
    defaultValue?: any
    options?: { label: string, value: string }[]
    validation?: 'required' | 'email' | 'number' | 'custom'
    validationMessage?: string
  }
  order: number
  isCustom: boolean
  showWhenValue?: string  // conditional visibility
}

FormAction {
  id: string (uuid)
  formId: string
  type: 'lead.update' | 'lead.points' | 'lead.tags' | 'send.email'
    | 'notification' | 'campaign.add' | 'asset.download'
  properties: Record<string, any>
  order: number
}

// === Scoring & Stages ===
PointAction {
  id: string (uuid)
  name: string
  type: 'page.hit' | 'form.submit' | 'email.open' | 'email.click'
    | 'asset.download' | 'social.action' | 'custom'
  points: number
  properties: Record<string, any>
  isPublished: boolean
}

PointTrigger {
  id: string (uuid)
  name: string
  type: 'form.submit' | 'page.hit' | 'email.open' | 'email.click'
    | 'points.reach'
  points: number  // threshold
  color: string
  action: 'lead.stage.change' | 'campaign.add' | 'send.email'
    | custom_action
  properties: Record<string, any>
  isPublished: boolean
}

Stage {
  id: string (uuid)
  name: string
  description: string
  weight: number  // ordering
  isPublished: boolean
}

// === Analytics ===
Report {
  id: string (uuid)
  name: string
  source: 'contacts' | 'leads' | 'campaigns' | 'emails' | 'forms'
    | 'pages' | 'assets' | 'points'
  columns: ReportColumn[]
  filters: ReportFilter[]
  graphs: ReportGraph[]
  isPublished: boolean
}

ReportColumn { field: string, label: string, aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' }
ReportFilter { column: string, operator: string, value: any }
ReportGraph { type: 'bar' | 'line' | 'pie' | 'table', options: Record<string, any> }

// === Webhooks ===
Webhook {
  id: string (uuid)
  name: string
  url: string
  secret: string
  eventTypes: WebhookEventType[]
    // lead.create, lead.update, lead.delete
    // email.open, email.click, email.send
    // form.submit
    // page.hit
    // campaign.event.triggered
    // point.change
  isPublished: boolean
  queueMode: 'immediate' | 'batch'
  lastExecution: Date
}

// === User & Permissions ===
User {
  id: string (uuid)
  email: string
  password: string
  firstName: string
  lastName: string
  roleId: string  // Role
  timezone: string
  locale: string
  lastActive: Date
  isPublished: boolean
}

Role {
  id: string (uuid)
  name: string
  description: string
  permissions: Record<string, PermissionSet>  // bundle => { create, edit, delete, view, publish }
  isAdmin: boolean
}
```

---

## 3. NestJS Backend Architecture

### 3.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (NestJS)                     │
│                    main.ts - app.module                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Auth Module│  │  REST API  │  │  WebSocket │             │
│  │ (Better    │  │  (v2 REST) │  │  (Real-time│             │
│  │  Auth)     │  │            │  │   events)  │             │
│  └────────────┘  └────────────┘  └────────────┘             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  Contact │ │ Campaign │ │  Email   │ │   Form   │        │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  Segment │ │  Point   │ │  Webhook │ │  Report  │        │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  Dynamic │ │  Channel │ │   SMS    │ │  Notif.  │        │
│  │ Content  │ │  Module  │ │  Module  │ │  Module  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Shared Infrastructure Layer              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐│    │
│  │  │ Database │  │  Queue   │  │  Mastra AI Agents   ││    │
│  │  │ (Drizzle+│  │ (BullMQ) │  │  (Campaign AI,      ││    │
│  │  │PostgreSQL)│  │          │  │   Content AI, etc.) ││    │
│  │  └──────────┘  └──────────┘  └─────────────────────┘│    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Module Design (NestJS Bundles)

Each Mautic "bundle" becomes a NestJS module. Here's the full module tree:

```
src/
├── main.ts                          # Bootstrap
├── app.module.ts                    # Root module
│
├── modules/
│   ├── core/                        # CoreBundle equivalent
│   │   ├── core.module.ts           # @Global() - config, caching, events
│   │   ├── config/                  # System configuration
│   │   ├── cache/                   # Redis cache service
│   │   ├── event-dispatcher/        # Event system (like Symfony events)
│   │   ├── helpers/                 # Utility services
│   │   ├── translation/             # i18n translation service
│   │   └── permission/              # Permission evaluator
│   │
│   ├── auth/                        # UserBundle + Auth
│   │   ├── auth.module.ts
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   └── role.entity.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── permission.guard.ts   # Route-level permission check
│   │   ├── decorators/
│   │   │   └── permissions.decorator.ts
│   │   └── services/
│   │       ├── auth.service.ts
│   │       ├── permission.service.ts
│   │       └── user.service.ts
│   │
│   ├── contacts/                    # LeadBundle (Contacts + Companies)
│   │   ├── contacts.module.ts
│   │   ├── controllers/
│   │   │   └── contacts.controller.ts
│   │   ├── entities/
│   │   │   ├── contact.entity.ts
│   │   │   ├── company.entity.ts
│   │   │   ├── tag.entity.ts
│   │   │   └── do-not-contact.entity.ts
│   │   ├── services/
│   │   │   ├── contact.service.ts
│   │   │   ├── contact-custom-field.service.ts  # Dynamic schema
│   │   │   ├── contact-merge.service.ts         # Deduplication
│   │   │   ├── company.service.ts
│   │   │   ├── tag.service.ts
│   │   │   └── contact-segment.service.ts
│   │   ├── listeners/
│   │   │   ├── contact-points.listener.ts   # Point changes on contact actions
│   │   │   └── contact-timeline.listener.ts # Audit trail
│   │   └── subscribers/
│   │       └── contact-custom-field.subscriber.ts  # Dynamic DDL sync
│   │
│   ├── segments/                     # LeadBundle (Segments/Lists)
│   │   ├── segments.module.ts
│   │   ├── controllers/
│   │   │   └── segments.controller.ts
│   │   ├── entities/
│   │   │   ├── segment.entity.ts
│   │   │   └── segment-membership.entity.ts
│   │   ├── services/
│   │   │   ├── segment.service.ts
│   │   │   ├── segment-evaluator.service.ts  # Dynamic segment query engine
│   │   │   └── segment-rebuild.service.ts    # Cron: rebuild membership
│   │   └── listeners/
│   │       └── segment-campaign.listener.ts
│   │
│   ├── campaigns/                    # CampaignBundle
│   │   ├── campaigns.module.ts
│   │   ├── controllers/
│   │   │   └── campaigns.controller.ts
│   │   ├── entities/
│   │   │   ├── campaign.entity.ts
│   │   │   ├── campaign-event.entity.ts
│   │   │   └── campaign-membership.entity.ts
│   │   ├── services/
│   │   │   ├── campaign.service.ts
│   │   │   ├── campaign-builder.service.ts     # Visual builder logic
│   │   │   ├── campaign-executor.service.ts    # THE CORE ENGINE
│   │   │   ├── campaign-scheduler.service.ts   # Cron: trigger processing
│   │   │   └── campaign-event-registry.service.ts  # Plugin event types
│   │   ├── executors/                          # Event execution handlers
│   │   │   ├── email-send.executor.ts
│   │   │   ├── stage-change.executor.ts
│   │   │   ├── point-change.executor.ts
│   │   │   ├── segment-add.executor.ts
│   │   │   ├── tag-action.executor.ts
│   │   │   ├── notification-send.executor.ts
│   │   │   ├── sms-send.executor.ts
│   │   │   ├── jump-to-step.executor.ts
│   │   │   └── registry.ts                      # Executor registry
│   │   ├── conditions/                          # Decision evaluators
│   │   │   ├── page-hit.condition.ts
│   │   │   ├── form-submit.condition.ts
│   │   │   ├── email-open.condition.ts
│   │   │   ├── email-click.condition.ts
│   │   │   ├── field-value.condition.ts
│   │   │   ├── segment-membership.condition.ts
│   │   │   ├── point-score.condition.ts
│   │   │   └── registry.ts
│   │   ├── listeners/
│   │   │   └── campaign-event.listener.ts
│   │   └── jobs/
│   │       ├── campaign-update.job.ts      # mautic:campaign:update
│   │       └── campaign-trigger.job.ts     # mautic:campaign:trigger
│   │
│   ├── email-marketing/               # EmailBundle
│   │   ├── email.module.ts
│   │   ├── controllers/
│   │   │   └── email.controller.ts
│   │   ├── entities/
│   │   │   ├── email.entity.ts
│   │   │   └── email-stat.entity.ts
│   │   ├── services/
│   │   │   ├── email.service.ts
│   │   │   ├── email-builder.service.ts       # Template + drag-drop builder
│   │   │   ├── email-sender.service.ts        # SES/Mailjet/Sendgrid adapter
│   │   │   ├── email-tracking.service.ts      # Pixel-based open/click tracking
│   │   │   ├── email-spool.service.ts         # Queue-based sending
│   │   │   └── email-variant.service.ts       # A/B testing engine
│   │   ├── listeners/
│   │   │   └── email-tracking.listener.ts
│   │   └── controllers/
│   │       └── tracking.controller.ts         # Open/click pixel endpoints
│   │
│   ├── forms/                         # FormBundle
│   │   ├── forms.module.ts
│   │   ├── controllers/
│   │   │   ├── forms.controller.ts
│   │   │   └── form-submission.controller.ts
│   │   ├── entities/
│   │   │   ├── form.entity.ts
│   │   │   ├── form-field.entity.ts
│   │   │   ├── form-action.entity.ts
│   │   │   └── form-submission.entity.ts
│   │   ├── services/
│   │   │   ├── form.service.ts
│   │   │   ├── form-builder.service.ts
│   │   │   ├── form-submission.service.ts
│   │   │   └── form-action-executor.service.ts  # Post-submit actions
│   │   └── listeners/
│   │       └── form-submission.listener.ts
│   │
│   ├── pages/                         # PageBundle
│   │   ├── pages.module.ts
│   │   ├── controllers/
│   │   │   ├── pages.controller.ts
│   │   │   └── tracking.controller.ts           # Page hit tracking pixel
│   │   ├── entities/
│   │   │   ├── page.entity.ts
│   │   │   └── page-hit.entity.ts
│   │   ├── services/
│   │   │   ├── page.service.ts
│   │   │   ├── page-builder.service.ts
│   │   │   └── page-tracking.service.ts
│   │   └── listeners/
│   │       └── page-hit.listener.ts
│   │
│   ├── assets/                        # AssetBundle
│   │   ├── assets.module.ts
│   │   ├── controllers/
│   │   │   └── assets.controller.ts
│   │   ├── entities/
│   │   │   ├── asset.entity.ts
│   │   │   └── asset-download.entity.ts
│   │   └── services/
│   │       └── asset.service.ts
│   │
│   ├── scoring/                       # PointBundle + StageBundle
│   │   ├── scoring.module.ts
│   │   ├── entities/
│   │   │   ├── point-action.entity.ts
│   │   │   ├── point-trigger.entity.ts
│   │   │   └── stage.entity.ts
│   │   ├── services/
│   │   │   ├── point.service.ts
│   │   │   ├── point-trigger.service.ts
│   │   │   └── stage.service.ts
│   │   ├── listeners/
│   │   │   ├── point-action.listener.ts         # Applies points on events
│   │   │   └── point-trigger.listener.ts        # Fires actions at thresholds
│   │   └── jobs/
│   │       └── point-recalculation.job.ts
│   │
│   ├── dynamic-content/               # DynamicContentBundle
│   │   ├── dynamic-content.module.ts
│   │   ├── entities/
│   │   │   └── dynamic-content.entity.ts
│   │   ├── services/
│   │   │   └── dynamic-content.service.ts       # Personalization engine
│   │   └── controllers/
│   │       └── dynamic-content.controller.ts
│   │
│   ├── webhooks/                      # WebhookBundle
│   │   ├── webhooks.module.ts
│   │   ├── entities/
│   │   │   └── webhook.entity.ts
│   │   ├── services/
│   │   │   ├── webhook.service.ts
│   │   │   ├── webhook-dispatcher.service.ts    # HTTP delivery
│   │   │   └── webhook-signature.service.ts     # HMAC signatures
│   │   ├── listeners/
│   │   │   └── webhook-event.listener.ts        # Subscribes to all events
│   │   └── jobs/
│   │       └── webhook-queue.job.ts
│   │
│   ├── channels/                      # ChannelBundle + NotificationBundle + SmsBundle
│   │   ├── channels.module.ts
│   │   ├── services/
│   │   │   ├── channel-router.service.ts       # Routes messages to channel
│   │   │   ├── sms-provider.service.ts          # Twilio/AfricasTalking adapter
│   │   │   ├── notification.service.ts          # Web push notifications
│   │   │   └── email-provider.service.ts        # SES/Sendgrid/Mailjet/SMTP
│   │   └── controllers/
│   │       └── channel.controller.ts
│   │
│   ├── reporting/                     # ReportBundle + DashboardBundle
│   │   ├── reporting.module.ts
│   │   ├── entities/
│   │   │   ├── report.entity.ts
│   │   │   └── dashboard-widget.entity.ts
│   │   ├── services/
│   │   │   ├── report.service.ts
│   │   │   ├── report-executor.service.ts       # SQL query builder
│   │   │   ├── dashboard.service.ts
│   │   │   └── chart-data.service.ts            # Chart.js data formatter
│   │   └── jobs/
│   │       └── report-cache.job.ts
│   │
│   ├── tracking/                      # Tracking + Stats
│   │   ├── tracking.module.ts
│   │   ├── services/
│   │   │   ├── tracking.service.ts
│   │   │   ├── visit.service.ts                 # Page visit tracking
│   │   │   └── stats-aggregator.service.ts      # Batch stat computation
│   │   ├── controllers/
│   │   │   └── tracking.controller.ts           # Contact tracking pixel
│   │   └── jobs/
│   │       └── stats-aggregation.job.ts         # Nightly aggregation
│   │
│   ├── integrations/                  # IntegrationsBundle
│   │   ├── integrations.module.ts
│   │   ├── services/
│   │   │   ├── integration-registry.service.ts
│   │   │   ├── crm-integration.service.ts
│   │   │   └── social-integration.service.ts
│   │   └── connectors/                          # Plugin architecture
│   │       ├── connection.interface.ts
│   │       ├── salesforce.connector.ts
│   │       ├── hubspot.connector.ts
│   │       └── zapier.connector.ts
│   │
│   └── plugins/                       # PluginBundle (extensibility)
│       ├── plugins.module.ts
│       ├── services/
│       │   ├── plugin-registry.service.ts
│       │   └── plugin-loader.service.ts
│       └── plugin.interface.ts
│
├── shared/
│   ├── interfaces/
│   │   ├── entity.interface.ts        # Base entity with id/timestamps
│   │   ├── crud.interface.ts          # Standard CRUD interface
│   │   └── permission.interface.ts    # Permission definitions
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts   # Wraps in { success, data }
│   │   └── timeout.interceptor.ts
│   ├── pipes/
│   │   ├── validation.pipe.ts
│   │   └── uuid-param.pipe.ts
│   ├── guards/
│   │   └── throttle.guard.ts          # Rate limiting
│   └── dto/
│       ├── pagination.dto.ts
│       ├── search.dto.ts
│       └── bulk-operations.dto.ts
│
├── database/
│   ├── schema/                        # Drizzle schema definitions
│   │   ├── index.ts
│   │   ├── contacts.schema.ts
│   │   ├── campaigns.schema.ts
│   │   ├── emails.schema.ts
│   │   └── ... (one per module)
│   ├── migrations/
│   └── seed/
│       └── seed.ts                    # Demo data
│
└── mastra/
    ├── mastra.config.ts
    ├── agents/
    │   ├── campaign-optimizer.agent.ts
    │   ├── content-writer.agent.ts
    │   ├── segment-analyst.agent.ts
    │   ├── analytics-interpreter.agent.ts
    │   ├── email-personalizer.agent.ts
    │   └── automation-advisor.agent.ts
    ├── tools/
    │   ├── analytics.tool.ts
    │   ├── contact-lookup.tool.ts
    │   ├── segment-analyzer.tool.ts
    │   ├── content-generator.tool.ts
    │   └── campaign-simulator.tool.ts
    └── workflows/
        ├── campaign-optimization.workflow.ts
        ├── content-generation.workflow.ts
        ├── segment-discovery.workflow.ts
        └── report-generation.workflow.ts
```

### 3.3 Key Architectural Decisions

**Event-Driven Architecture:**
Mautic's entire automation engine is event-driven. Events like `contact.created`, `email.opened`, `form.submitted` trigger campaign decisions and webhooks. We use NestJS EventEmitter + BullMQ for this.

```
Event Flow:
1. Action happens (contact submits form)
2. Event emitted: 'form.submitted'
3. Multiple listeners react:
   a. CampaignEventSubscriber -> Check if form submission triggers campaign events
   b. PointActionSubscriber -> Apply points for form submission
   c. WebhookSubscriber -> Fire webhook if configured
   d. StatsSubscriber -> Record the stat
   e. SegmentEvaluator -> Check if contact qualifies for new segments
```

**Campaign Execution Engine:**
The heart of Mautic. Two cron-triggered jobs:
1. `campaign-update.job` -- Evaluates campaign membership (adds/removes contacts based on segment membership and manual add/remove events)
2. `campaign-trigger.job` -- Walks through campaign event DAG for each contact and executes pending events

The engine uses a DAG (directed acyclic graph) walker:
```
For each contact in campaign:
  1. Get contact's current position in campaign
  2. Evaluate event at current position
  3. If action -> execute it, move to next event
  4. If decision -> check condition, follow 'yes' or 'no' branch
  5. If wait -> schedule for future execution
  6. Log all events to campaign_lead_event_log
```

**Custom Field System:**
Mautic's custom fields use dynamic DDL (adding columns to leads table). Our approach:
- Store all custom fields as a JSONB column on the contacts/companies tables
- Maintain a `field_metadata` table describing each custom field (alias, type, group, properties)
- Use Drizzle JSONB queries for filtering: `sql` template literals with `->>` operator
- This eliminates the need for runtime DDL changes

**Dynamic Segment Query Engine:**
Segments with `type: 'dynamic'` have filter conditions that must be evaluated against contacts. We build SQL from the filter tree:
```typescript
// Segment filter: { field: 'email', operator: 'like', value: '%@example.com' }
// Generates: WHERE contacts.fields->>'email' ILIKE '%@example.com'
class SegmentQueryBuilder {
  buildWhereClause(filters: SegmentFilter[]): SqlFragment {
    return filters.map(f => this.buildCondition(f)).join(' AND ');
  }
}
```

**Plugin System:**
Instead of Mautic's Symfony bundle system, we use NestJS Dynamic Modules:
```typescript
@Injectable()
export class PluginRegistry {
  private plugins = new Map<string, DynamicModule>();

  register(plugin: PluginInterface): void {
    // Plugin provides:
    // - Event types for campaigns
    // - Report sources
    // - Widget types
    // - Form field types
    // - Integration connectors
  }
}
```

**Queue Architecture:**
BullMQ with Redis for async processing:
- Email sending (spool-based, configurable rate)
- Webhook delivery
- Campaign execution
- Stats aggregation
- Segment rebuilding

**Email Tracking:**
Mautic uses tracking pixels and redirect URLs:
- Open tracking: 1x1 transparent pixel with unique contact ID in URL
- Click tracking: All links rewritten through `/r/{redirectId}` that logs and redirects
- Tracking images and redirects served by dedicated endpoints with no-auth caching

---

## 4. Next.js Frontend Architecture

### 4.1 UI Component Tree

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
│
├── dashboard/
│   ├── layout.tsx                 # Sidebar + Top nav
│   ├── page.tsx                   # Dashboard widgets
│   └── reports/
│       ├── page.tsx               # Report list
│       ├── new/
│       │   └── page.tsx           # Report builder
│       ├── [id]/
│       │   ├── page.tsx           # Report detail
│       │   └── edit/page.tsx      # Report editor
│       └── preview/
│           └── page.tsx           # Report preview
│
├── contacts/
│   ├── page.tsx                   # Contact list (table with filters)
│   ├── new/
│   │   └── page.tsx               # New contact form
│   ├── [id]/
│   │   ├── page.tsx               # Contact detail (timeline)
│   │   ├── edit/
│   │   │   └── page.tsx           # Edit contact
│   │   ├── segments/
│   │   │   └── page.tsx           # Manage segment membership
│   │   └── campaigns/
│   │       └── page.tsx           # Campaign membership
│   └── import/
│       └── page.tsx               # CSV import
│
├── segments/
│   ├── page.tsx                   # Segment list
│   ├── new/
│   │   └── page.tsx               # Segment builder (filter UI)
│   └── [id]/
│       ├── page.tsx               # Segment detail + contacts
│       └── edit/
│           └── page.tsx           # Edit filters
│
├── campaigns/
│   ├── page.tsx                   # Campaign list
│   ├── new/
│   │   └── page.tsx               # Campaign wizard
│   └── [id]/
│       ├── page.tsx               # Campaign detail
│       ├── builder/
│       │   └── page.tsx           # VISUAL DAG CAMPAIGN BUILDER
│       ├── edit/
│       │   └── page.tsx           # Campaign settings
│       └── contacts/
│           └── page.tsx           # Campaign contacts
│
├── emails/
│   ├── page.tsx                   # Email list
│   ├── new/
│   │   └── page.tsx               # Email wizard
│   └── [id]/
│       ├── page.tsx               # Email detail (stats)
│       ├── edit/
│       │   └── page.tsx           # Email editor (GrapesJS integration)
│       └── variants/
│           └── page.tsx           # A/B variant management
│
├── forms/
│   ├── page.tsx                   # Form list
│   ├── new/
│   │   └── page.tsx               # Form wizard
│   └── [id]/
│       ├── page.tsx               # Form detail (submissions)
│       ├── builder/
│       │   └── page.tsx           # DRAG & DROP FORM BUILDER
│       ├── edit/
│       │   └── page.tsx           # Form settings
│       └── embed/
│           └── page.tsx           # Embed code
│
├── pages/
│   ├── page.tsx                   # Landing page list
│   ├── new/
│   │   └── page.tsx               # New page
│   └── [id]/
│       ├── page.tsx               # Page detail (hits)
│       └── edit/
│           └── page.tsx           # Page editor
│
├── assets/
│   ├── page.tsx                   # Asset list
│   └── [id]/
│       └── page.tsx               # Asset detail (downloads)
│
├── points/
│   ├── page.tsx                   # Point actions + triggers
│   └── [id]/
│       └── edit/page.tsx
│
├── stages/
│   ├── page.tsx                   # Stage list
│   └── [id]/
│       └── edit/page.tsx
│
├── automation/
│   ├── page.tsx                   # AI automation dashboard
│   ├── campaign-optimizer/
│   │   └── page.tsx               # AI campaign recommendations
│   ├── content-writer/
│   │   └── page.tsx               # AI content generation
│   ├── segment-discovery/
│   │   └── page.tsx               # AI segment suggestions
│   └── email-personalizer/
│       └── page.tsx               # AI email personalization
│
├── settings/
│   ├── general/
│   │   └── page.tsx
│   ├── users/
│   │   ├── page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── roles/
│   │   ├── page.tsx
│   │   └── [id]/edit/page.tsx
│   ├── api/
│   │   └── page.tsx               # API credentials management
│   └── webhooks/
│       └── page.tsx               # Webhook management
│
└── integrations/
    ├── page.tsx                   # Integration marketplace
    └── [type]/
        └── config/page.tsx        # Integration configuration

// Shared Components
components/
├── ui/                            # shadcn/ui components
├── layout/
│   ├── app-sidebar.tsx            # Navigation sidebar
│   ├── top-nav.tsx
│   └── breadcrumbs.tsx
├── data-table.tsx                 # Reusable data table (TanStack Table)
├── search-input.tsx
├── filter-bar.tsx                 # Advanced filter UI
├── date-range-picker.tsx
├── stat-card.tsx                  # Dashboard KPI card
├── chart-wrapper.tsx              # Chart rendering
├── contact-avatar.tsx
├── timeline.tsx                   # Contact timeline component
├── campaign-builder/
│   ├── canvas.tsx                 # DAG canvas (React Flow)
│   ├── event-node.tsx             # Campaign event node
│   ├── decision-node.tsx          # Decision branch node
│   ├── condition-node.tsx         # Condition node
│   ├── event-panel.tsx            # Event configuration panel
│   └── toolbar.tsx                # Builder toolbar
├── form-builder/
│   ├── canvas.tsx                 # Form layout canvas
│   ├── field-palette.tsx          # Draggable field types
│   ├── field-properties.tsx       # Field settings panel
│   └── preview.tsx                # Form preview
├── email-builder/
│   ├── editor.tsx                 # GrapesJS wrapper
│   ├── template-browser.tsx
│   └── mobile-preview.tsx
├── segment-builder/
│   ├── filter-row.tsx
│   ├── filter-group.tsx
│   └── preview-count.tsx
├── reporting/
│   ├── chart-configurator.tsx
│   ├── column-selector.tsx
│   └── report-table.tsx
└── ai/
    ├── chat-panel.tsx             # AI chat interface
    ├── suggestion-card.tsx
    ├── campaign-recommendation.tsx
    └── content-preview.tsx
```

### 4.2 Key Frontend Components

**Campaign Builder (React Flow):**
The visual campaign builder is the marquee feature. Uses React Flow to render a DAG of campaign events. Users drag events from a palette onto the canvas, connect them, and configure properties.

```
┌────────────────────────────────────────────┐
│  ┌─────────┐  ┌────────────┐  ┌─────────┐  │
│  │ START   │─→│Decision:   │─→│ Action: │  │
│  │ Segment │  │Email Open? │  │Send SMS │  │
│  └─────────┘  └─────┬──────┘  └─────────┘  │
│                      │ NO                   │
│                      ▼                      │
│                ┌────────────┐               │
│                │ Action:    │               │
│                │ Add Points │               │
│                └────────────┘               │
└────────────────────────────────────────────┘
```

**Form Builder (dnd-kit):**
Drag-and-drop form field builder using dnd-kit. Fields from palette to canvas, configure field properties in a side panel.

**Data Tables (TanStack Table):**
All list views use TanStack Table v8 with server-side pagination, filtering, sorting, and column visibility. URL-synced state for shareable filters.

**Chart Rendering:**
Dashboard and reports use shadcn/ui Chart components (built on Recharts) for bar, line, pie, and area charts.

**AI Agent Interface:**
Chat-like interface for interacting with Mastra agents. Side-by-side views for recommendations vs. current state.

---

## 5. AI Agent System (Mastra)

### 5.1 Agent Architecture

```
┌─────────────────────────────────────────────────────┐
│               AI Orchestrator Agent                  │
│              (Supervisor - qwen3-30b)                 │
│  Routes requests to specialized agents + aggregates  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Campaign    │ │Content   │ │Segment Analyst   │  │
│  │ Optimizer   │ │Writer    │ │ (qwen3-30b)      │  │
│  │ (claude-opus)│ │(claude-op│ │                   │  │
│  └─────────────┘ └──────────┘ └──────────────────┘  │
│                                                       │
│  ┌─────────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Analytics   │ │Email     │ │Automation        │  │
│  │ Interpreter  │ │Personaliz│ │Advisor           │  │
│  │ (qwen3-30b) │ │(claude-op│ │(qwen3-30b)       │  │
│  └─────────────┘ └──────────┘ └──────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 5.2 Agent Definitions

**1. Campaign Optimizer Agent** (claude-opus-4-6)
- Analyzes campaign performance data
- Suggests optimal send times, audience segments, message variants
- Recommends A/B test configurations
- Identifies campaign bottlenecks (drop-off points)
- Tools: analytics-lookup, campaign-stats, segment-analyzer, contact-lookup

**2. Content Writer Agent** (claude-opus-4-6)
- Generates email subject lines and body copy
- Creates landing page content
- Writes form copy and CTAs
- Adapts tone to brand voice guides
- Tools: content-generator, brand-guide-lookup, template-library

**3. Segment Analyst Agent** (qwen3-30b)
- Analyzes contact data for pattern discovery
- Suggests new dynamic segment definitions
- Identifies high-value contact clusters
- Recommends lookalike segment criteria
- Tools: contact-lookup, segment-analyzer, data-profiler

**4. Analytics Interpreter Agent** (qwen3-30b)
- Reads report data and generates natural language summaries
- Explains campaign performance in plain English
- Identifies trends and anomalies
- Generates PDF-ready report narratives
- Tools: analytics-lookup, report-builder, trend-detector

**5. Email Personalizer Agent** (claude-opus-4-6)
- Generates dynamic content blocks per contact
- Personalizes subject lines based on behavior
- Creates product recommendations for email
- Optimizes send times per contact timezone
- Tools: contact-lookup, content-generator, send-time-optimizer

**6. Automation Advisor Agent** (qwen3-30b)
- Reviews current automation setup
- Recommends new campaign triggers based on behavior patterns
- Identifies automation gaps (unhandled events)
- Suggests scoring model adjustments
- Tools: campaign-stats, automation-audit, best-practice-library

### 5.3 AI Tool Definitions

```typescript
// analytics-lookup.tool.ts - Query aggregated analytics data
const analyticsLookupTool = {
  name: 'analytics_lookup',
  schema: z.object({
    entity: z.enum(['campaigns', 'emails', 'forms', 'contacts', 'segments']),
    metric: z.string(), // e.g. 'open_rate', 'click_rate', 'conversion'
    dateRange: z.object({ start: z.string(), end: z.string() }),
    filters: z.record(z.any()).optional(),
  }),
  execute: async ({ entity, metric, dateRange, filters }) => {
    return analyticsService.query(entity, metric, dateRange, filters);
  },
};

// content-generator.tool.ts - Generate marketing content
const contentGeneratorTool = {
  name: 'content_generator',
  schema: z.object({
    type: z.enum(['email_subject', 'email_body', 'landing_page', 'cta', 'sms']),
    brief: z.string(),
    tone: z.enum(['professional', 'casual', 'urgent', 'friendly']).optional(),
    brandGuide: z.string().optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
  }),
  execute: async ({ type, brief, tone, brandGuide, length }) => {
    // Uses LLM to generate content within agent context
    // Returns structured content suggestions
  },
};

// segment-analyzer.tool.ts - Analyze contact segments
const segmentAnalyzerTool = {
  name: 'segment_analyzer',
  schema: z.object({
    segmentId: z.string().optional(),
    criteria: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.any(),
    })).optional(),
  }),
  execute: async ({ segmentId, criteria }) => {
    if (segmentId) return segmentService.analyze(segmentId);
    return segmentService.estimateMembership(criteria);
  },
};
```

### 5.4 AI Workflows

**Campaign Optimization Workflow:**
```
1. Analytics Interpreter Agent fetches campaign stats
2. Campaign Optimizer Agent reviews performance data
3. Segment Analyst Agent identifies best-performing segments
4. Content Writer Agent drafts improved content variants
5. Email Personalizer Agent generates personalized versions
6. Orchestrator compiles recommendations report
7. Human approves or modifies suggestions
8. Changes applied to campaign configuration
```

**Content Generation Workflow:**
```
1. User provides brief (topic, audience, goal)
2. Content Writer Agent generates 3 variants
3. Email Personalizer Agent suggests personalization hooks
4. Orchestrator presents options with predicted performance
5. User selects variant, modifies
6. Content saved to email/page/form template library
```

---

## 6. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] NestJS project scaffold with all module stubs
- [ ] Database schema (Drizzle) -- all core entities
- [ ] Better Auth integration (users, roles, permissions)
- [ ] Core module (config, caching, events, helpers)
- [ ] API infrastructure (error handling, validation, pagination)
- [ ] Next.js project scaffold with shadcn/ui
- [ ] App layout (sidebar, top nav, auth layout)
- [ ] Auth pages (login, forgot password, reset password)

### Phase 2: Contact Management (Weeks 3-4)
- [ ] Contact CRUD with custom fields (JSONB)
- [ ] Company CRUD
- [ ] Tag management
- [ ] Contact merge/deduplication
- [ ] Contact timeline
- [ ] CSV import
- [ ] UI: Contact list, detail, edit, import pages
- [ ] UI: Contact timeline component
- [ ] UI: Data table with server-side features

### Phase 3: Segmentation (Week 5)
- [ ] Segment CRUD
- [ ] Dynamic segment filter builder
- [ ] Segment query engine (SQL from filter tree)
- [ ] Segment membership (add/remove, auto-rebuild)
- [ ] Segment membership tracking cron
- [ ] UI: Segment list, builder, detail pages

### Phase 4: Campaign Engine (Weeks 6-8)
- [ ] Campaign CRUD
- [ ] Campaign event types registry
- [ ] Campaign event executors (email, stage, points, tags, etc.)
- [ ] Campaign decision conditions
- [ ] Campaign execution engine (DAG walker)
- [ ] Campaign update + trigger cron jobs
- [ ] Campaign membership management
- [ ] UI: Campaign list, detail pages
- [ ] UI: Campaign builder (React Flow DAG canvas)
- [ ] UI: Event configuration panels

### Phase 5: Email Marketing (Weeks 9-10)
- [ ] Email CRUD
- [ ] Email template system
- [ ] Email sending (spool + adapter pattern)
- [ ] Email tracking (open pixel, click redirect)
- [ ] Email stats collection
- [ ] A/B testing engine
- [ ] UI: Email list, detail pages
- [ ] UI: Email builder (GrapesJS or custom)
- [ ] UI: Email stats dashboard

### Phase 6: Forms & Pages (Weeks 11-12)
- [ ] Form CRUD
- [ ] Form field types
- [ ] Form submission handling
- [ ] Form post-submit actions
- [ ] Landing page CRUD
- [ ] Page hit tracking
- [ ] UI: Form builder (dnd-kit)
- [ ] UI: Form list, detail, embed pages
- [ ] UI: Page list, detail pages
- [ ] UI: Drag-and-drop form builder

### Phase 7: Scoring & Stages (Week 13)
- [ ] Point action CRUD
- [ ] Point trigger CRUD
- [ ] Point calculation on events
- [ ] Point trigger actions at thresholds
- [ ] Stage CRUD + lifecycle management
- [ ] UI: Point actions/triggers list
- [ ] UI: Stage management pages

### Phase 8: Dynamic Content (Week 14)
- [ ] Dynamic content CRUD
- [ ] Personalization engine (token replacement)
- [ ] Contact-based content filtering
- [ ] UI: Dynamic content list, editor pages

### Phase 9: Webhooks & Integrations (Week 15)
- [ ] Webhook CRUD
- [ ] Webhook event subscription
- [ ] Webhook dispatcher (HTTP delivery)
- [ ] Webhook signature (HMAC-SHA256)
- [ ] Webhook queue mode (immediate/batch)
- [ ] Integration framework (plugin interface)
- [ ] Zapier-like connector system
- [ ] UI: Webhook management pages
- [ ] UI: Integration marketplace

### Phase 10: Reporting & Analytics (Week 16)
- [ ] Report CRUD
- [ ] Report SQL query builder
- [ ] Dashboard widget CRUD
- [ ] Stats aggregation cron
- [ ] UI: Report list, builder pages
- [ ] UI: Dashboard with configurable widgets
- [ ] UI: Chart components

### Phase 11: AI Agent Integration (Weeks 17-18)
- [ ] Mastra agent definitions
- [ ] Agent tools (analytics, content, segment)
- [ ] Campaign optimizer workflow
- [ ] Content writer workflow
- [ ] Segment discovery workflow
- [ ] Analytics interpreter
- [ ] Email personalizer
- [ ] UI: AI dashboard
- [ ] UI: Chat panel per agent
- [ ] UI: Campaign recommendations view
- [ ] UI: Content generation interface

### Phase 12: Polish & Production (Weeks 19-20)
- [ ] End-to-end testing (Playwright)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Docker setup
- [ ] CI/CD pipeline
- [ ] Documentation
- [ ] Demo data seed

---

## 7. Database Schema (Drizzle)

```typescript
// Key schema files in src/database/schema/

// contacts.schema.ts
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  fields: jsonb('fields').notNull().default('{}'),  // Custom fields
  ownerId: uuid('owner_id').references(() => users.id),
  points: integer('points').notNull().default(0),
  lastActive: timestamp('last_active'),
  dateIdentified: timestamp('date_identified'),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// campaigns.schema.ts
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  canvasSettings: jsonb('canvas_settings'),  // Nodes + connections for visual builder
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const campaignEvents = pgTable('campaign_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(),  // 'decision' | 'condition' | 'action'
  eventType: varchar('event_type', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  triggerMode: varchar('trigger_mode', { length: 30 }).default('immediate'),
  triggerInterval: integer('trigger_interval'),
  triggerIntervalUnit: varchar('trigger_interval_unit', { length: 5 }),
  properties: jsonb('properties').default('{}'),
  position: jsonb('position'),  // { x: number, y: number } for canvas
  parentId: uuid('parent_id'),
  decisionPath: varchar('decision_path', { length: 5 }),  // 'yes' | 'no'
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// emails.schema.ts
export const emails = pgTable('emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body'),
  plainText: text('plain_text'),
  template: varchar('template', { length: 50 }),
  type: varchar('type', { length: 50 }).default('template'),  // 'template' | 'list'
  listId: uuid('list_id').references(() => segments.id),
  isPublished: boolean('is_published').default(false),
  variantSettings: jsonb('variant_settings'),  // A/B testing config
  headers: jsonb('headers'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// forms.schema.ts
export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  kiosk: boolean('kiosk').default(false),
  captureLead: boolean('capture_lead').default(true),
  template: varchar('template', { length: 50 }),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Additional tables: segments, companies, tags, webhooks, reports,
// point_actions, point_triggers, stages, dynamic_content,
// form_fields, form_submissions, page_hits, email_stats,
// campaign_memberships, campaign_lead_event_logs, etc.
```

---

## 8. Tech Stack Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend Framework | NestJS 11 | Modular architecture, DI, guards, interceptors |
| ORM | Drizzle ORM | Type-safe, PostgreSQL, JSONB support |
| Database | PostgreSQL 16 | pgvector for AI features |
| Auth | Better Auth + JWT | Session management, RBAC |
| Frontend | Next.js 16 | App Router, Server Components |
| UI | shadcn/ui + Tailwind v4 | Consistent design system |
| Data Tables | TanStack Table v8 | Server-side pagination, filtering, sorting |
| Forms | react-hook-form + Zod | Type-safe form validation |
| Campaign Builder | React Flow | DAG-based visual workflow builder |
| Form Builder | dnd-kit | Drag-and-drop field builder |
| Charts | shadcn/ui Chart + Recharts | Dashboard and report visualizations |
| Email Templates | GrapesJS or custom MJML | Drag-and-drop email builder |
| Queue | BullMQ (Redis) | Async email/webhook/campaign processing |
| Cache | Redis | Session cache, API cache, stats cache |
| AI Framework | Mastra.ai | Multi-agent orchestration |
| AI Models | Ollama Cloud (qwen3-30b, claude-opus-4-6) | Tiered by task complexity |
| CI/CD | GitHub Actions | UltraCite lint + tests |
| Container | Docker | Multi-stage build |
| Payment | PayFast (SA market) | For marketplace/plugin sales |
"""

