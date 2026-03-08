import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ChecklistResponse } from './checklist-response.entity';

export enum ChecklistItemType {
  YES_NO = 'yes_no',
  TEXT = 'text',
  NUMBER = 'number',
  RATING = 'rating',
  MULTIPLE_CHOICE = 'multiple_choice',
  PHOTO = 'photo',
  SIGNATURE = 'signature',
}

export interface ChecklistItem {
  id: string;
  question: string;
  type: ChecklistItemType;
  required: boolean;
  order: number;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  helpText?: string;
}

@Entity('checklist_templates')
export class ChecklistTemplate extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  items: ChecklistItem[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'version', type: 'integer', default: 1 })
  version: number;

  @OneToMany(() => ChecklistResponse, (r) => r.template)
  responses: ChecklistResponse[];
}
