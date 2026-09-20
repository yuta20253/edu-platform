# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateStudyLogService, type: :model do
  describe '#call' do
    subject(:service) do
      described_class.new(
        user: user,
        task: task,
        unit: unit
      )
    end

    let!(:user) { create(:user) }
    let!(:goal) { create(:goal, user: user) }
    let!(:task) { create(:task, user: user, goal: goal) }
    let!(:unit) { create(:unit) }

    before do
      task.units << unit
    end

    it 'StudyLogを作成できること' do
      expect { service.call }.to change(StudyLog, :count).by(1)

      study_log = StudyLog.last

      expect(study_log.user).to eq(user)
      expect(study_log.task).to eq(task)
      expect(study_log.unit).to eq(unit)
      expect(study_log.status).to eq('studying')
      expect(study_log.started_at).to be_present
      expect(study_log.ended_at).to be_nil
      expect(study_log.duration_minutes).to be_nil
    end

    it '開始時刻を現在時刻で記録すること' do
      travel_to Time.zone.parse('2026-08-09 10:00:00') do
        service.call

        expect(StudyLog.last.started_at).to eq(
          Time.zone.parse('2026-08-09 10:00:00')
        )
      end
    end

    it '作成したStudyLogのIDを返すこと' do
      study_log_id = service.call

      expect(study_log_id).to eq(StudyLog.last.id)
    end

    it '同じTask/Unitで複数のStudyLogを作成できること' do
      first_study_log_id = service.call
      second_study_log_id = service.call

      expect(StudyLog.count).to eq(2)
      expect(second_study_log_id).not_to eq(first_study_log_id)
    end

    context 'taskがnot_startedの場合' do
      it 'taskのstatusがin_progressに更新されること' do
        service.call

        expect(task.reload.status).to eq('in_progress')
      end
    end

    context 'taskが既にin_progressの場合' do
      let!(:task) { create(:task, :in_progress, user: user, goal: goal) }

      it 'taskのstatusは変わらないこと' do
        expect { service.call }.not_to(change { task.reload.status })
      end
    end
  end
end
