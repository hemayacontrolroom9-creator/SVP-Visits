import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ChecklistTemplate } from './checklist-template.entity';
import { Visit } from '../../visits/entities/visit.entity';

export interface ChecklistAnswer {
  itemId: string;
  question: string;
  answer: any;
  photoUrls?: string[];
  notes?: string;
}

@Entity('checklist_responses')
export class ChecklistResponse extends BaseEntity {
  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => ChecklistTemplate, (t) => t.responses)
  @JoinColumn({ name: 'template_id' })
  template: ChecklistTemplate;

  @Column({ name: 'visit_id' })
  visitId: string;

  @ManyToOne(() => Visit, (v) => v.checklistResponses)
  @JoinColumn({ name: 'visit_id' })
  visit: Visit;

  @Column({ type: 'jsonb' })
  answers: ChecklistAnswer[];

  @Column({ name: 'submitted_by' })
  submittedBy: string;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date;

  @Column({ name: 'score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ name: 'total_items', type: 'integer', default: 0 })
  totalItems: number;

  @Column({ name: 'completed_items', type: 'integer', default: 0 })
  completedItems: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_submitted', default: false })
  isSubmitted: boolean;
}
