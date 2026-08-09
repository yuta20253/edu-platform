# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CompleteStudyLogService, type: :model do
  describe '#call' do
    subject(:service) { described_class.new(study_log: study_log) }

    let!(:user) { create(:user) }
    let!(:task) { create(:task, user: user) }
    let!(:unit) { create(:unit) }
    let!(:study_log) do
      create(
        :study_log,
        user: user,
        task: task,
        unit: unit,
        status: :studying,
        started_at: started_at
      )
    end
    let(:started_at) { Time.zone.parse('2026-08-09 10:00:00') }

    before do
      task.units << unit
    end

    context '学習中の場合' do
      it 'StudyLogを完了できること' do
        travel_to Time.zone.parse('2026-08-09 10:30:00') do
          result = service.call

          study_log.reload

          expect(result).to eq(study_log)
          expect(study_log.status).to eq('completed')
          expect(study_log.ended_at).to eq(
            Time.zone.parse('2026-08-09 10:30:00')
          )
          expect(study_log.duration_minutes).to eq(30)
        end
      end

      it '学習時間を切り捨てて分単位で保存すること' do
        travel_to Time.zone.parse('2026-08-09 10:30:45') do
          service.call

          study_log.reload

          expect(study_log.duration_minutes).to eq(30)
        end
      end
    end

    context 'すでに完了している場合' do
      let!(:study_log) do
        create(
          :study_log,
          user: user,
          task: task,
          unit: unit,
          status: :completed,
          started_at: Time.zone.parse('2026-08-09 10:00:00'),
          ended_at: Time.zone.parse('2026-08-09 10:30:00'),
          duration_minutes: 30
        )
      end

      it 'AlreadyCompletedStudyLogErrorを発生させること' do
        expect { service.call }
          .to raise_error(Student::AlreadyCompletedStudyLogError) do |error|
            expect(error.errors).to eq(['この学習ログはすでに完了しています'])
          end
      end

      it 'StudyLogを変更しないこと' do
        original_status = study_log.status
        original_started_at = study_log.started_at
        original_ended_at = study_log.ended_at
        original_duration_minutes = study_log.duration_minutes

        travel_to Time.zone.parse('2026-08-09 11:00:00') do
          expect { service.call }
            .to raise_error(Student::AlreadyCompletedStudyLogError)
        end

        study_log.reload

        expect(study_log.status).to eq(original_status)
        expect(study_log.started_at).to eq(original_started_at)
        expect(study_log.ended_at).to eq(original_ended_at)
        expect(study_log.duration_minutes).to eq(original_duration_minutes)
      end
    end
  end
end
