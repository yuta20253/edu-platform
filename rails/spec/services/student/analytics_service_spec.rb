# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::AnalyticsService, type: :model do
  describe '#call' do
    let(:user) { instance_double(User) }

    context 'task_completionの場合' do
      it 'TaskCompletionを呼ぶ' do
        service = instance_double(Student::Analytics::TaskCompletion, call: {})

        allow(Student::Analytics::TaskCompletion)
          .to receive(:new)
          .with(user)
          .and_return(service)

        described_class.new(
          user: user,
          type: 'task_completion'
        ).call

        expect(Student::Analytics::TaskCompletion)
          .to have_received(:new)
          .with(user)
      end
    end

    context 'understanding_scoreの場合' do
      it 'UnderstandingScoreを呼ぶ' do
        service = instance_double(Student::Analytics::UnderstandingScore, call: {})

        allow(Student::Analytics::UnderstandingScore)
          .to receive(:new)
          .with(user)
          .and_return(service)

        described_class.new(
          user: user,
          type: 'understanding_score'
        ).call

        expect(Student::Analytics::UnderstandingScore)
          .to have_received(:new)
          .with(user)
      end
    end

    context 'grade_averageの場合' do
      it 'GradeAverageを呼ぶ' do
        service = instance_double(Student::Analytics::GradeAverage, call: {})

        allow(Student::Analytics::GradeAverage)
          .to receive(:new)
          .with(user)
          .and_return(service)

        described_class.new(
          user: user,
          type: 'grade_average'
        ).call

        expect(Student::Analytics::GradeAverage)
          .to have_received(:new)
          .with(user)
      end
    end

    context 'course_rankの場合' do
      it 'Rankを呼ぶ' do
        service = instance_double(Student::Analytics::Rank, call: {})

        allow(Student::Analytics::Rank)
          .to receive(:new)
          .with(user, :course_id, 1)
          .and_return(service)

        described_class.new(
          user: user,
          type: 'course_rank',
          course_id: 1
        ).call

        expect(Student::Analytics::Rank)
          .to have_received(:new)
          .with(user, :course_id, 1)
      end
    end

    context 'unit_rankの場合' do
      it 'Rankを呼ぶ' do
        service = instance_double(Student::Analytics::Rank, call: {})

        allow(Student::Analytics::Rank)
          .to receive(:new)
          .with(user, :unit_id, 1)
          .and_return(service)

        described_class.new(
          user: user,
          type: 'unit_rank',
          unit_id: 1
        ).call

        expect(Student::Analytics::Rank)
          .to have_received(:new)
          .with(user, :unit_id, 1)
      end
    end

    context '存在しないtypeの場合' do
      it 'ArgumentErrorを発生させる' do
        expect do
          described_class.new(
            user: user,
            type: 'unknown'
          ).call
        end.to raise_error(
          ArgumentError,
          '指定された分析タイプ（unknown）は存在しません。'
        )
      end
    end
  end
end
