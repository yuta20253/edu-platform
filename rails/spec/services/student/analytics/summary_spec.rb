# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::Analytics::Summary do
  describe '#call' do
    subject(:result) { described_class.new(user, from: from, to: to).call }

    let(:user) { create(:user) }
    let(:task) { create(:task, user: user) }

    let!(:english) { create(:subject, name: '英語') }
    let!(:math) { create(:subject, name: '数学') }
    let!(:japanese) { create(:subject, name: '国語') }

    def create_task_due_on(date, completed: false)
      traits = completed ? [:completed] : []
      create(:task, *traits, user: user, due_date: date)
    end

    def study_on(started_at, minutes)
      create(:study_log, user: user, task: task, started_at: Time.zone.parse(started_at), duration_minutes: minutes)
    end

    def answer(subject_record, answered_at, correct:)
      course = create(:course, subject: subject_record)
      unit = create(:unit, course: course)
      question = create(:question, unit: unit)
      create(:question_history,
             user: user, task: task, course: course, unit: unit, question: question,
             question_choice: create(:question_choice, question: question),
             is_correct: correct, answered_at: Time.zone.parse(answered_at))
    end

    # 実行日と同じ日付にすると「今日」の扱いの誤りを見逃すため、実行日とずらした日付に固定する
    around do |example|
      travel_to(Time.zone.parse('2026-09-11 12:00:00')) { example.run }
    end

    context '今期間・前期間の両方にデータがある場合(7日間)' do
      # 前期間は同じ日数だけ遡った 8/29〜9/4
      let(:from) { Date.new(2026, 9, 5) }
      let(:to) { Date.new(2026, 9, 11) }

      before do
        # タスク: 今期間は2件中1件完了、前期間は1件中1件完了、期間外は数えない
        create_task_due_on(Date.new(2026, 9, 6), completed: true)
        create_task_due_on(Date.new(2026, 9, 7))
        create_task_due_on(Date.new(2026, 9, 1), completed: true)
        create_task_due_on(Date.new(2026, 9, 12), completed: true)

        # 学習記録: 今期間は9/10・9/11(連続2日)、前期間は9/3
        study_on('2026-09-10 20:00:00', 20)
        study_on('2026-09-11 08:00:00', 30)
        study_on('2026-09-03 08:00:00', 15)

        # 解答: 英語は今期間・前期間の両方、数学は今期間だけ、国語は前期間だけ
        answer(english, '2026-09-08 10:00:00', correct: true)
        answer(english, '2026-09-09 10:00:00', correct: false)
        answer(english, '2026-09-02 10:00:00', correct: true)
        answer(math, '2026-09-08 10:00:00', correct: true)
        answer(japanese, '2026-09-02 10:00:00', correct: true)
      end

      it '連続日数を返す' do
        expect(result[:streak_days]).to eq(2)
      end

      it 'タスク達成率を今期間・前期間で返す' do
        expect(result[:task_completion]).to eq(
          current: { completed_count: 1, total_count: 2, completion_rate: 50.0 },
          previous: { completed_count: 1, total_count: 1, completion_rate: 100.0 }
        )
      end

      it '学習時間のseriesは今期間の日別で返す' do
        study_minutes = result[:study_minutes]

        expect(study_minutes[:unit]).to eq('day')
        expect(study_minutes[:series].first).to eq(date: Date.new(2026, 9, 5), minutes: 0)
        expect(study_minutes[:series].last).to eq(date: Date.new(2026, 9, 11), minutes: 30)
        expect(study_minutes[:series].size).to eq(7)
      end

      it '学習時間の合計を今期間・前期間で返す' do
        expect(result[:study_minutes][:total]).to eq(current: 50, previous: 15)
      end

      it '教科ごとの正答率は、今期間に解答がある教科だけを、前期間の値と並べて返す(前期間に解答がなければnil)' do
        expect(result[:subject_progress]).to eq(
          [
            { subject_name: '英語', correct_rate: { current: 50.0, previous: 100.0 } },
            { subject_name: '数学', correct_rate: { current: 100.0, previous: nil } }
          ]
        )
      end

      it 'metaに今期間と前期間の日付を返す' do
        expect(result[:meta]).to eq(
          from: Date.new(2026, 9, 5),
          to: Date.new(2026, 9, 11),
          previous_from: Date.new(2026, 8, 29),
          previous_to: Date.new(2026, 9, 4)
        )
      end
    end

    context '期間が32日以上の場合' do
      # 前期間は同じ32日だけ遡った 6/30〜7/31
      let(:from) { Date.new(2026, 8, 1) }
      let(:to) { Date.new(2026, 9, 1) }

      it "学習時間のunitが'week'になる" do
        expect(result[:study_minutes][:unit]).to eq('week')
      end

      it '前期間は同じ日数だけ遡った連続期間になる' do
        expect(result[:meta]).to include(previous_from: Date.new(2026, 6, 30), previous_to: Date.new(2026, 7, 31))
      end
    end

    context 'データがない場合' do
      let(:from) { Date.new(2026, 9, 5) }
      let(:to) { Date.new(2026, 9, 11) }

      it 'すべて0または空で返す' do
        expect(result[:streak_days]).to eq(0)
        expect(result[:task_completion]).to eq(
          current: { completed_count: 0, total_count: 0, completion_rate: 0 },
          previous: { completed_count: 0, total_count: 0, completion_rate: 0 }
        )
        expect(result[:study_minutes][:total]).to eq(current: 0, previous: 0)
        expect(result[:subject_progress]).to eq([])
      end
    end
  end
end
