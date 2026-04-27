# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::TaskCompletionService, type: :model do
  subject(:service) do
    described_class.new(
      user: user,
      task_id: task.id
    )
  end

  let!(:prefecture) do
    create(
      :prefecture,
      name: '東京都'
    )
  end

  let!(:high_school) do
    create(
      :high_school,
      name: 'A高校',
      prefecture: prefecture
    )
  end

  let!(:user) do
    create(
      :user,
      high_school: high_school
    )
  end

  let!(:goal) do
    create(
      :goal,
      user: user
    )
  end

  let!(:task) do
    create(
      :task,
      user: user,
      goal: goal
    )
  end

  let!(:course) do
    create(:course)
  end

  let!(:unit_one) do
    create(
      :unit,
      course: course
    )
  end

  let!(:unit_two) do
    create(
      :unit,
      course: course
    )
  end

  let!(:task_unit_one) do
    create(
      :task_unit,
      task: task,
      unit: unit_one
    )
  end

  let!(:task_unit_two) do
    create(
      :task_unit,
      task: task,
      unit: unit_two
    )
  end

  let!(:question_one) do
    create(
      :question,
      unit: unit_one
    )
  end

  let!(:question_two) do
    create(
      :question,
      unit: unit_one
    )
  end

  let!(:question_three) do
    create(
      :question,
      unit: unit_two
    )
  end

  let!(:choice_one) do
    create(
      :question_choice,
      question: question_one,
      choice_number: 1
    )
  end

  let!(:choice_two) do
    create(
      :question_choice,
      question: question_two,
      choice_number: 1
    )
  end

  let!(:choice_three) do
    create(
      :question_choice,
      question: question_three,
      choice_number: 1
    )
  end

  describe '#call' do
    context 'taskが存在しない場合' do
      subject(:service) do
        described_class.new(
          user: user,
          task_id: 999_999
        )
      end

      it 'not_startedを返す' do
        expect(service.call).to eq(:not_started)
      end
    end

    context '解答履歴が1件もない場合' do
      it 'not_startedを返す' do
        expect(service.call).to eq(:not_started)
      end
    end

    context '一部のみ解答済みの場合' do
      before do
        create(
          :question_history,
          user: user,
          task: task,
          course: course,
          unit: unit_one,
          question: question_one,
          question_choice: choice_one,
          answered_at: Time.current
        )
      end

      it 'in_progressを返す' do
        expect(service.call).to eq(:in_progress)
      end
    end

    context '全問解答済みの場合' do
      before do
        create(
          :question_history,
          user: user,
          task: task,
          course: course,
          unit: unit_one,
          question: question_one,
          question_choice: choice_one,
          answered_at: Time.current
        )

        create(
          :question_history,
          user: user,
          task: task,
          course: course,
          unit: unit_one,
          question: question_two,
          question_choice: choice_two,
          answered_at: Time.current
        )

        create(
          :question_history,
          user: user,
          task: task,
          course: course,
          unit: unit_two,
          question: question_three,
          question_choice: choice_three,
          answered_at: Time.current
        )
      end

      it 'completedを返す' do
        expect(service.call).to eq(:completed)
      end
    end

    context '既存履歴が更新されている場合' do
      let!(:question_history) do
        create(
          :question_history,
          user: user,
          task: task,
          course: course,
          unit: unit_one,
          question: question_one,
          question_choice: choice_one,
          answered_at: 5.minutes.ago
        )
      end

      before do
        question_history.update!(
          question_choice: choice_one,
          answered_at: Time.current
        )
      end

      it 'in_progressを返す' do
        expect(service.call).to eq(:in_progress)
      end
    end
  end
end
