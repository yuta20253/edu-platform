# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InterviewRequestsQuery, type: :model do
  let!(:student) { create(:user, :student) }
  let!(:teacher) { create(:user, :teacher) }
  let!(:other_student) { create(:user, :student) }
  let!(:other_teacher) { create(:user, :teacher) }

  describe '#for_participant' do
    let!(:request_for_student) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher,
                                                        scheduled_at: Time.zone.local(2026, 3, 15, 10, 0))
    end
    let!(:request_for_other_pair) do
      create(:interview_request, :initiated_by_teacher, student: other_student, teacher: other_teacher,
                                                        scheduled_at: Time.zone.local(2026, 3, 16, 10, 0))
    end

    it '生徒として関係している面談が返る' do
      result = described_class.new(InterviewRequest.all)
                              .for_participant(student)
                              .within_period(from: Date.new(2026, 3, 1), to: Date.new(2026, 3, 31))
                              .result

      expect(result).to contain_exactly(request_for_student)
    end

    it '教員として関係している面談が返る' do
      result = described_class.new(InterviewRequest.all)
                              .for_participant(teacher)
                              .within_period(from: Date.new(2026, 3, 1), to: Date.new(2026, 3, 31))
                              .result

      expect(result).to contain_exactly(request_for_student)
    end

    it '関係していない面談は除外される' do
      result = described_class.new(InterviewRequest.all)
                              .for_participant(student)
                              .within_period(from: Date.new(2026, 3, 1), to: Date.new(2026, 3, 31))
                              .result

      expect(result).not_to include(request_for_other_pair)
    end
  end

  describe '#within_period' do
    # NOTE: 同一student/teacherペアで進行中(active)の面談は1件までという制約があるため、
    # 1件を除いてstatus: :completedにして制約を回避している(scheduled_atの絞り込み検証が目的のため、statusの値自体は無関係)
    let!(:request_before_range) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :completed,
                                                        scheduled_at: Time.zone.local(2026, 2, 28, 23, 59))
    end
    let!(:request_at_from) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :completed,
                                                        scheduled_at: Time.zone.local(2026, 3, 1, 0, 0))
    end
    let!(:request_within_range) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher,
                                                        scheduled_at: Time.zone.local(2026, 3, 15, 10, 0))
    end
    let!(:request_at_to) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :completed,
                                                        scheduled_at: Time.zone.local(2026, 3, 31, 23, 59))
    end
    let!(:request_after_range) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :completed,
                                                        scheduled_at: Time.zone.local(2026, 4, 1, 0, 0))
    end
    let!(:request_without_scheduled_at) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :completed,
                                                        scheduled_at: nil)
    end

    it '期間内のscheduled_atを持つ面談のみ返る(境界値は含む)' do
      result = described_class.new(InterviewRequest.all)
                              .for_participant(student)
                              .within_period(from: Date.new(2026, 3, 1), to: Date.new(2026, 3, 31))
                              .result

      expect(result).to contain_exactly(request_at_from, request_within_range, request_at_to)
    end

    it 'scheduled_atがnilの面談は除外される' do
      result = described_class.new(InterviewRequest.all)
                              .for_participant(student)
                              .within_period(from: Date.new(2026, 1, 1), to: Date.new(2026, 12, 31))
                              .result

      expect(result).not_to include(request_without_scheduled_at)
    end
  end

  describe '#exclude_cancelled' do
    let!(:cancelled_teacher) { create(:user, :teacher) }
    let!(:cancelled_request) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: cancelled_teacher,
                                                        status: :cancelled,
                                                        scheduled_at: Time.zone.local(2026, 3, 15, 10, 0))
    end
    let!(:active_request) do
      create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher,
                                                        scheduled_at: Time.zone.local(2026, 3, 16, 10, 0))
    end

    it 'cancelledの面談は除外される' do
      result = described_class.new(InterviewRequest.all)
                              .for_participant(student)
                              .exclude_cancelled
                              .result

      expect(result).to contain_exactly(active_request)
    end
  end
end
