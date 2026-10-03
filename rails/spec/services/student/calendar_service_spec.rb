# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CalendarService, type: :model do
  subject(:call) { described_class.new(user: user, from_date: from_date, to_date: to_date).call }

  let(:user) { create(:user, :student) }
  let(:other_user) { create(:user, :student) }
  let(:from_date) { Date.new(2026, 3, 1) }
  let(:to_date) { Date.new(2026, 3, 31) }

  describe '#call' do
    let!(:task_in_range) do
      create(:task, user: user, goal: create(:goal, user: user), title: 'タスクA', due_date: Date.new(2026, 3, 5))
    end
    let!(:goal_in_range) { create(:goal, user: user, title: 'ゴールA', due_date: Date.new(2026, 3, 10)) }
    let!(:teacher) { create(:user, :teacher) }
    let!(:interview_request_in_range) do
      create(:interview_request, :initiated_by_student, student: user, teacher: teacher,
                                                        reason_detail: '進路について相談したい',
                                                        scheduled_at: Time.zone.local(2026, 3, 20, 10, 0))
    end

    let!(:goal_out_of_range) { create(:goal, user: user, due_date: Date.new(2026, 4, 1)) }
    let!(:task_out_of_range) do
      create(:task, user: user, goal: create(:goal, user: user), due_date: Date.new(2026, 2, 1))
    end
    let!(:other_teacher) { create(:user, :teacher) }
    let!(:interview_request_out_of_range) do
      create(:interview_request, :initiated_by_student, student: user, teacher: other_teacher,
                                                        scheduled_at: Time.zone.local(2026, 4, 10, 10, 0))
    end

    let!(:goal_other_user) { create(:goal, user: other_user, due_date: Date.new(2026, 3, 12)) }
    let!(:task_other_user) do
      create(:task, user: other_user, goal: create(:goal, user: other_user), due_date: Date.new(2026, 3, 7))
    end
    let!(:interview_request_other_user) do
      create(:interview_request, :initiated_by_student, student: other_user, teacher: teacher,
                                                        scheduled_at: Time.zone.local(2026, 3, 22, 10, 0))
    end

    let!(:unscheduled_teacher) { create(:user, :teacher) }
    let!(:interview_request_unscheduled) do
      create(:interview_request, :initiated_by_student, student: user, teacher: unscheduled_teacher,
                                                        scheduled_at: nil)
    end

    it '期間内のgoal・task・interview_requestのみを日付昇順でまとめた配列を返す' do
      expect(call.pluck(:type)).to eq(%w[task goal interview_request])
    end

    it 'goalの要素がtype/id/date/title/statusを持つ' do
      item = call.find { |i| i[:type] == 'goal' }

      expect(item).to eq(
        type: 'goal',
        id: goal_in_range.id,
        date: '2026/03/10',
        title: 'ゴールA',
        status: 'not_started'
      )
    end

    it 'taskの要素がtype/id/date/title/statusを持つ' do
      item = call.find { |i| i[:type] == 'task' }

      expect(item).to eq(
        type: 'task',
        id: task_in_range.id,
        date: '2026/03/05',
        title: 'タスクA',
        status: 'not_started'
      )
    end

    it 'interview_requestの要素はdateがscheduled_atの日付部分、titleがreason_detailになる' do
      item = call.find { |i| i[:type] == 'interview_request' }

      expect(item).to eq(
        type: 'interview_request',
        id: interview_request_in_range.id,
        date: '2026/03/20',
        title: '進路について相談したい',
        status: 'requested'
      )
    end

    it '期間外のデータは含まれない' do
      ids = call.pluck(:id)

      expect(ids).not_to include(goal_out_of_range.id, task_out_of_range.id, interview_request_out_of_range.id)
    end

    it '他ユーザーのデータは含まれない' do
      ids = call.pluck(:id)

      expect(ids).not_to include(goal_other_user.id, task_other_user.id, interview_request_other_user.id)
    end

    it 'scheduled_atが未確定の面談は含まれない' do
      expect(call.pluck(:id)).not_to include(interview_request_unscheduled.id)
    end
  end
end
