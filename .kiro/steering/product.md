# Product: Pesisir PPJK Operations Assistant

## What it is

An **on-premise PPJK (Indonesian customs-brokerage) operations assistant**. It turns WhatsApp conversations and uploaded trade documents into structured, traceable operational records, deployed on customer-controlled infrastructure because PPJK data (customer identities, invoices, customs records, permits) is commercially and legally sensitive.

## Primary interface

WhatsApp via the **OpenClaw** agent. The web UI (`apps/project-management`) complements it for overview, review, and detailed editing — it is not the primary product interface.

## Core capabilities

- Link incoming messages and documents to the correct operational entity (event, shipment, customs job)
- Extract structured facts from trade documents with full source lineage and provenance
- Track extraction facts through information states: `SOURCE_BACKED | CONFIRMED | INFERRED | UNKNOWN | CONFLICTING | NOT_APPLICABLE`
- Enforce lifecycle rules for customs jobs, shipments, CIPLs, and tickets
- Provide idempotent, audited mutations so agent-triggered operations are safe to retry
- Surface reminders, reconciliation, and workflow coordination; gate high-stakes decisions (customs submissions, payments, amendments) on authorized human approval

## What it is not

- Not a generic event-management website
- Not a cloud-dependent document-extraction service (document interpretation belongs to OpenClaw, not the backend)
- Not a system that silently invents missing customs facts — unknown, inferred, and confirmed information are always distinguishable

## Domain entities (primary)

Events → EventExhibitors → Shipments → CustomsJobs → CiplVersions → Tickets  
Supporting: EventOrganizers, Venues, Exhibitors, Agents, Contacts, SourceDocuments, DocumentExtractions
