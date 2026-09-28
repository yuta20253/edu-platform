# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AnalyticsQuery, type: :model do
  # taskファクトリの`association :goal`はデフォルトで別の新規ユーザーを持つgoalを作る。
  # 母集団の件数を厳密に検証するテストが汚染されるため、goalの持ち主を明示的に揃える。
  def create_task_for(user)
    create(:task, user: user, goal: create(:goal, user: user))
  end

  # question_historiesファクトリの`association :question`/`:question_choice`は
  # デフォルトでunitとは無関係な単元・講座を新規作成してしまう。#content_coverage は
  # 単元・講座の総数を素で数えるため、そうした無関係なレコードが数値を汚染してしまう。
  # そのため明示していない限りquestion/question_choiceを指定されたunitに揃える。
  def create_question_history_for(user, **attrs)
    unit = attrs[:unit] || create(:unit)
    question = attrs[:question] || create(:question, unit: unit)
    choice = attrs[:question_choice] || create(:question_choice, question: question)
    course = attrs[:course] || unit.course

    create(:question_history, user: user, task: create_task_for(user),
                              **attrs.merge(unit: unit, question: question, question_choice: choice, course: course))
  end

  def create_study_log_for(user, **attrs)
    create(:study_log, user: user, task: create_task_for(user), **attrs)
  end

  # ワースト系ランキングはHAVING COUNT(*) >= MIN_ANSWER_COUNT(20件)のテストで
  # 大量レコードが必要になる。question_historiesには
  # [user_id, task_id, unit_id, question_id]のユニーク制約があるため、
  # (同じ設問への複数回答を表現するため)行ごとに別タスクを割り当てて作る。
  def bulk_create_histories(user:, unit:, question:, counts:, answered_at: Time.zone.local(2026, 8, 20, 10))
    total, correct = counts
    course = unit.course
    choice = create(:question_choice, question: question)
    goal = create(:goal, user: user)
    tasks = create_list(:task, total, user: user, goal: goal)
    now = Time.current

    rows = tasks.each_with_index.map do |task, i|
      {
        user_id: user.id, course_id: course.id, unit_id: unit.id, question_id: question.id,
        question_choice_id: choice.id, task_id: task.id, is_correct: i < correct,
        explanation_viewed: false, time_spent_sec: 30, answer_text: 'A',
        answered_at: answered_at, created_at: now, updated_at: now
      }
    end
    QuestionHistory.insert_all!(rows)
  end

  describe '#kpis' do
    subject(:kpis) { described_class.new(from: from, to: to).kpis }

    let(:from) { Date.new(2026, 8, 13) }
    let(:to) { Date.new(2026, 9, 11) }
    let!(:student) { create(:user) }

    describe ':active_student_count' do
      it '期間内に解答履歴がある生徒を数える' do
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 10))

        expect(kpis[:active_student_count][:current]).to eq(1)
      end

      it '期間内に学習ログがある生徒を数える' do
        create_study_log_for(student, started_at: Time.zone.local(2026, 8, 20, 10))

        expect(kpis[:active_student_count][:current]).to eq(1)
      end

      it '解答履歴と学習ログの両方がある生徒を二重に数えない' do
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 10))
        create_study_log_for(student, started_at: Time.zone.local(2026, 8, 21, 10))

        expect(kpis[:active_student_count][:current]).to eq(1)
      end

      it '期間外の活動は数えない' do
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 12, 23, 59))

        expect(kpis[:active_student_count][:current]).to eq(0)
      end

      it '論理削除済みの解答履歴・学習ログしかない生徒を数えない' do
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 10), deleted_at: Time.current)

        expect(kpis[:active_student_count][:current]).to eq(0)
      end

      it '論理削除済みの生徒は活動があっても数えない' do
        student.update!(deleted_at: Time.current)
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 10))

        expect(kpis[:active_student_count][:current]).to eq(0)
      end

      it '招待未受諾の生徒は活動があっても数えない' do
        student.update!(password_reset_required: true)
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 10))

        expect(kpis[:active_student_count][:current]).to eq(0)
      end

      it '教師の活動を数えない' do
        teacher = create(:user, :teacher)
        create_question_history_for(teacher, answered_at: Time.zone.local(2026, 8, 20, 10))

        expect(kpis[:active_student_count][:current]).to eq(0)
      end
    end

    describe ':answer_count' do
      it '期間内の解答件数を返す' do
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 10))
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 21, 10))

        expect(kpis[:answer_count][:current]).to eq(2)
      end

      it '論理削除済みの解答履歴を数えない' do
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 10), deleted_at: Time.current)

        expect(kpis[:answer_count][:current]).to eq(0)
      end

      it '活動がない場合は0を返す' do
        expect(kpis[:answer_count][:current]).to eq(0)
      end
    end

    describe ':accuracy_rate' do
      it '正答率を百分率・小数1桁で返す' do
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 10), is_correct: true)
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 11), is_correct: true)
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 20, 12), is_correct: false)

        expect(kpis[:accuracy_rate][:current]).to eq(66.7)
      end

      it '解答が無い場合は0を返す(0除算にならない)' do
        expect(kpis[:accuracy_rate][:current]).to eq(0)
      end
    end

    describe ':study_minutes' do
      it '期間内に開始した学習ログの分数を合計する' do
        create_study_log_for(student, started_at: Time.zone.local(2026, 8, 20, 10), duration_minutes: 30)
        create_study_log_for(student, started_at: Time.zone.local(2026, 8, 21, 10), duration_minutes: 45)

        expect(kpis[:study_minutes][:current]).to eq(75)
      end

      it '未完了(duration_minutesがnil)のセッションは0として扱う' do
        create_study_log_for(student, started_at: Time.zone.local(2026, 8, 20, 10), duration_minutes: nil,
                                      status: :studying)

        expect(kpis[:study_minutes][:current]).to eq(0)
      end

      it '学習ログがない場合は0を返す' do
        expect(kpis[:study_minutes][:current]).to eq(0)
      end
    end

    describe ':previous (前期間)' do
      it '同じ日数だけ手前に遡った連続期間で算出する' do
        # from..to は 2026-08-13..2026-09-11 (30日間)。前期間は 2026-07-14..2026-08-12。
        create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 1, 10))

        expect(kpis[:answer_count][:previous]).to eq(1)
        expect(kpis[:answer_count][:current]).to eq(0)
      end

      it '前期間より前の活動は含めない' do
        create_question_history_for(student, answered_at: Time.zone.local(2026, 7, 1, 10))

        expect(kpis[:answer_count][:previous]).to eq(0)
      end
    end

    context 'high_school_idを指定した場合' do
      subject(:kpis) { described_class.new(from: from, to: to, high_school_id: target_school.id).kpis }

      let(:target_school) { create(:high_school) }
      let(:other_school) { create(:high_school) }

      it '指定した高校の生徒のみ集計する' do
        target_student = create(:user, high_school: target_school)
        other_student = create(:user, high_school: other_school)
        create_question_history_for(target_student, answered_at: Time.zone.local(2026, 8, 20, 10))
        create_question_history_for(other_student, answered_at: Time.zone.local(2026, 8, 20, 10))

        expect(kpis[:answer_count][:current]).to eq(1)
      end
    end

    context 'subject_idを指定した場合' do
      subject(:kpis) { described_class.new(from: from, to: to, subject_id: target_subject.id).kpis }

      let(:target_subject) { create(:subject) }
      let(:other_subject) { create(:subject) }
      let(:target_course) { create(:course, subject: target_subject) }
      let(:other_course) { create(:course, subject: other_subject) }

      it '指定した科目の講座に属する解答のみ集計する' do
        create_question_history_for(student, course: target_course, answered_at: Time.zone.local(2026, 8, 20, 10))
        create_question_history_for(student, course: other_course, answered_at: Time.zone.local(2026, 8, 20, 10))

        expect(kpis[:answer_count][:current]).to eq(1)
      end

      it '指定した科目の単元に属する学習ログのみ集計する' do
        target_unit = create(:unit, course: target_course)
        other_unit = create(:unit, course: other_course)
        create_study_log_for(student, unit: target_unit, started_at: Time.zone.local(2026, 8, 20, 10),
                                      duration_minutes: 10)
        create_study_log_for(student, unit: other_unit, started_at: Time.zone.local(2026, 8, 20, 10),
                                      duration_minutes: 20)

        expect(kpis[:study_minutes][:current]).to eq(10)
      end
    end
  end

  describe '#daily_activity' do
    subject(:daily_activity) { described_class.new(from: from, to: to).daily_activity }

    let(:from) { Date.new(2026, 8, 20) }
    let(:to) { Date.new(2026, 8, 22) }
    let!(:student) { create(:user) }

    it 'from..toの全日分を返す' do
      expect(daily_activity.pluck(:date)).to eq(%w[2026-08-20 2026-08-21 2026-08-22])
    end

    it '記録の無い日を0で埋める' do
      expect(daily_activity).to all(include(active_student_count: 0, answer_count: 0, accuracy_rate: 0))
    end

    it '日別の解答数・アクティブ生徒数・正答率を返す' do
      create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 21, 10), is_correct: true)
      create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 21, 11), is_correct: false)

      row = daily_activity.find { |r| r[:date] == '2026-08-21' }
      expect(row).to include(active_student_count: 1, answer_count: 2, accuracy_rate: 50.0)
    end

    it '同日に複数生徒が解答してもactive_student_countは重複排除される' do
      other_student = create(:user)
      create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 21, 10))
      create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 21, 11))
      create_question_history_for(other_student, answered_at: Time.zone.local(2026, 8, 21, 12))

      row = daily_activity.find { |r| r[:date] == '2026-08-21' }
      expect(row).to include(active_student_count: 2, answer_count: 3)
    end

    it 'JST日付でバケットする(UTC 15:00以降の解答は翌日のJST日付に入る)' do
      create_question_history_for(student, answered_at: Time.utc(2026, 8, 20, 15, 0, 0))

      row_on_20th = daily_activity.find { |r| r[:date] == '2026-08-20' }
      row_on_21st = daily_activity.find { |r| r[:date] == '2026-08-21' }
      expect(row_on_20th).to include(answer_count: 0)
      expect(row_on_21st).to include(answer_count: 1)
    end

    it '論理削除済みの解答履歴を数えない' do
      create_question_history_for(student, answered_at: Time.zone.local(2026, 8, 21, 10), deleted_at: Time.current)

      row = daily_activity.find { |r| r[:date] == '2026-08-21' }
      expect(row).to include(answer_count: 0)
    end

    context 'subject_idを指定した場合' do
      subject(:daily_activity) { described_class.new(from: from, to: to, subject_id: target_subject.id).daily_activity }

      let(:target_subject) { create(:subject) }
      let(:other_subject) { create(:subject) }
      let(:target_course) { create(:course, subject: target_subject) }
      let(:other_course) { create(:course, subject: other_subject) }

      it '指定した科目の講座に属する解答のみ集計する' do
        create_question_history_for(student, course: target_course, answered_at: Time.zone.local(2026, 8, 21, 10))
        create_question_history_for(student, course: other_course, answered_at: Time.zone.local(2026, 8, 21, 10))

        row = daily_activity.find { |r| r[:date] == '2026-08-21' }
        expect(row).to include(answer_count: 1)
      end
    end
  end

  describe '#low_accuracy_units' do
    subject(:low_accuracy_units) { described_class.new(from: from, to: to).low_accuracy_units }

    let(:from) { Date.new(2026, 8, 1) }
    let(:to) { Date.new(2026, 8, 31) }
    let!(:student) { create(:user) }
    let!(:subject_record) { create(:subject) }
    let!(:course) { create(:course, subject: subject_record) }

    it '正答率の低い単元を昇順で返す' do
      low_unit = create(:unit, course: course)
      high_unit = create(:unit, course: course)
      bulk_create_histories(user: student, unit: low_unit, question: create(:question, unit: low_unit),
                            counts: [20, 5])
      bulk_create_histories(user: student, unit: high_unit, question: create(:question, unit: high_unit),
                            counts: [20, 15])

      expect(low_accuracy_units.pluck(:unit_id)).to eq([low_unit.id, high_unit.id])
    end

    it '解答数・正答率・単元名・講座名・科目名を返す' do
      unit = create(:unit, course: course)
      bulk_create_histories(user: student, unit: unit, question: create(:question, unit: unit), counts: [20, 5])

      expect(low_accuracy_units.first).to include(
        unit_id: unit.id, unit_name: unit.unit_name, course_id: course.id,
        course_name: course.level_name, subject_name: subject_record.name,
        answer_count: 20, accuracy_rate: 25.0
      )
    end

    it '解答数がMIN_ANSWER_COUNT未満の単元を除外する' do
      unit = create(:unit, course: course)
      bulk_create_histories(user: student, unit: unit, question: create(:question, unit: unit),
                            counts: [Admin::AnalyticsQuery::MIN_ANSWER_COUNT - 1, 0])

      expect(low_accuracy_units).to be_empty
    end

    it '上位RANKING_LIMIT件までに絞る' do
      units = Array.new(Admin::AnalyticsQuery::RANKING_LIMIT + 1) { create(:unit, course: course) }
      units.each_with_index do |unit, i|
        bulk_create_histories(user: student, unit: unit, question: create(:question, unit: unit), counts: [20, i])
      end

      expect(low_accuracy_units.size).to eq(Admin::AnalyticsQuery::RANKING_LIMIT)
      expect(low_accuracy_units.pluck(:unit_id)).not_to include(units.last.id)
    end

    it '期間外の解答は数えない' do
      unit = create(:unit, course: course)
      bulk_create_histories(user: student, unit: unit, question: create(:question, unit: unit), counts: [20, 5],
                            answered_at: Time.zone.local(2026, 7, 1, 10))

      expect(low_accuracy_units).to be_empty
    end

    context 'subject_idを指定した場合' do
      subject(:low_accuracy_units) do
        described_class.new(from: from, to: to, subject_id: subject_record.id).low_accuracy_units
      end

      it '他科目の単元を含めない' do
        other_subject = create(:subject)
        other_course = create(:course, subject: other_subject)
        other_unit = create(:unit, course: other_course)
        bulk_create_histories(user: student, unit: other_unit, question: create(:question, unit: other_unit),
                              counts: [20, 5])

        expect(low_accuracy_units).to be_empty
      end
    end
  end

  describe '#low_accuracy_questions' do
    subject(:low_accuracy_questions) { described_class.new(from: from, to: to).low_accuracy_questions }

    let(:from) { Date.new(2026, 8, 1) }
    let(:to) { Date.new(2026, 8, 31) }
    let!(:student) { create(:user) }
    let!(:course) { create(:course) }
    let!(:unit) { create(:unit, course: course) }

    it '正答率の低い設問を昇順で返す' do
      low_question = create(:question, unit: unit)
      high_question = create(:question, unit: unit)
      bulk_create_histories(user: student, unit: unit, question: low_question, counts: [20, 5])
      bulk_create_histories(user: student, unit: unit, question: high_question, counts: [20, 15])

      expect(low_accuracy_questions.pluck(:question_id)).to eq([low_question.id, high_question.id])
    end

    it '設問文・単元名・講座IDを返し、設問文は80文字に切り詰める' do
      question = create(:question, unit: unit, question_text: 'あ' * 100)
      bulk_create_histories(user: student, unit: unit, question: question, counts: [20, 5])

      row = low_accuracy_questions.first
      expect(row).to include(
        question_id: question.id, unit_id: unit.id, unit_name: unit.unit_name,
        course_id: course.id, answer_count: 20, accuracy_rate: 25.0
      )
      expect(row[:question_text]).to eq('あ' * 80)
    end

    it '解答数がMIN_ANSWER_COUNT未満の設問を除外する' do
      question = create(:question, unit: unit)
      bulk_create_histories(user: student, unit: unit, question: question,
                            counts: [Admin::AnalyticsQuery::MIN_ANSWER_COUNT - 1, 0])

      expect(low_accuracy_questions).to be_empty
    end

    it '上位RANKING_LIMIT件までに絞る' do
      questions = Array.new(Admin::AnalyticsQuery::RANKING_LIMIT + 1) { create(:question, unit: unit) }
      questions.each_with_index do |question, i|
        bulk_create_histories(user: student, unit: unit, question: question, counts: [20, i])
      end

      expect(low_accuracy_questions.size).to eq(Admin::AnalyticsQuery::RANKING_LIMIT)
      expect(low_accuracy_questions.pluck(:question_id)).not_to include(questions.last.id)
    end
  end

  describe '#high_school_usage' do
    subject(:high_school_usage) { described_class.new(from: from, to: to).high_school_usage }

    let(:from) { Date.new(2026, 8, 1) }
    let(:to) { Date.new(2026, 8, 31) }
    let(:answered_at) { Time.zone.local(2026, 8, 20, 10) }

    it 'アクティブ率の昇順で返す(使われていない高校が上)' do
      inactive_school = create(:high_school)
      active_school = create(:high_school)
      create_list(:user, 4, high_school: inactive_school)
      active_students = create_list(:user, 4, high_school: active_school)
      create_question_history_for(active_students.first, answered_at: answered_at)

      rows = high_school_usage
      expect(rows.pluck(:high_school_id)).to eq([inactive_school.id, active_school.id])
    end

    it '在籍数・アクティブ数・アクティブ率・解答数・正答率を返す' do
      school = create(:high_school)
      students = create_list(:user, 4, high_school: school)
      create_question_history_for(students.first, answered_at: answered_at, is_correct: true)
      create_question_history_for(students.first, answered_at: answered_at, is_correct: false)
      create_study_log_for(students.second, started_at: answered_at)

      row = high_school_usage.find { |r| r[:high_school_id] == school.id }
      expect(row).to include(
        high_school_name: school.name, student_count: 4, active_student_count: 2,
        active_rate: 50.0, answer_count: 2, accuracy_rate: 50.0
      )
    end

    it '解答も学習ログもある生徒を二重に数えない' do
      school = create(:high_school)
      students = create_list(:user, 2, high_school: school)
      create_question_history_for(students.first, answered_at: answered_at)
      create_study_log_for(students.first, started_at: answered_at)

      row = high_school_usage.find { |r| r[:high_school_id] == school.id }
      expect(row).to include(active_student_count: 1)
    end

    it '在籍生徒が1人もいない高校は結果に含めない' do
      empty_school = create(:high_school)

      expect(high_school_usage.pluck(:high_school_id)).not_to include(empty_school.id)
    end

    it '教師を在籍生徒数に数えない' do
      school = create(:high_school)
      create(:user, high_school: school)
      create(:user, :teacher, high_school: school)

      row = high_school_usage.find { |r| r[:high_school_id] == school.id }
      expect(row).to include(student_count: 1)
    end

    it '招待未受諾・論理削除済みの生徒を在籍生徒数に数えない' do
      school = create(:high_school)
      create(:user, high_school: school)
      create(:user, :invitation_pending, high_school: school)
      create(:user, high_school: school, deleted_at: Time.current)

      row = high_school_usage.find { |r| r[:high_school_id] == school.id }
      expect(row).to include(student_count: 1)
    end

    context 'high_school_idを指定した場合' do
      subject(:high_school_usage) do
        described_class.new(from: from, to: to, high_school_id: target_school.id).high_school_usage
      end

      let(:target_school) { create(:high_school) }

      it '指定した高校の1行のみ返す' do
        other_school = create(:high_school)
        create(:user, high_school: target_school)
        create(:user, high_school: other_school)

        expect(high_school_usage.pluck(:high_school_id)).to eq([target_school.id])
      end
    end

    context 'subject_idを指定した場合' do
      subject(:high_school_usage) do
        described_class.new(from: from, to: to, subject_id: target_subject.id).high_school_usage
      end

      let(:target_subject) { create(:subject) }
      let(:other_subject) { create(:subject) }
      let(:target_course) { create(:course, subject: target_subject) }
      let(:other_course) { create(:course, subject: other_subject) }

      it '指定した科目の解答のみ集計する' do
        school = create(:high_school)
        student = create(:user, high_school: school)
        create_question_history_for(student, course: target_course, answered_at: answered_at)
        create_question_history_for(student, course: other_course, answered_at: answered_at)

        row = high_school_usage.find { |r| r[:high_school_id] == school.id }
        expect(row).to include(answer_count: 1)
      end
    end
  end

  describe '#content_coverage' do
    subject(:content_coverage) { described_class.new(from: from, to: to).content_coverage }

    let(:from) { Date.new(2026, 8, 1) }
    let(:to) { Date.new(2026, 8, 31) }
    let!(:course) { create(:course) }
    let!(:student) { create(:user) }

    it '講座に属する単元の総数を返す' do
      create_list(:unit, 3, course: course)

      expect(content_coverage[:total_units]).to eq(3)
    end

    it '論理削除済みの単元・講座を総数に数えない' do
      create(:unit, course: course, deleted_at: Time.current)
      create(:unit, course: create(:course, deleted_at: Time.current))
      create(:unit, course: course)

      expect(content_coverage[:total_units]).to eq(1)
    end

    it '問題が0件の単元数を返す' do
      create(:unit, course: course)
      unit_with_question = create(:unit, course: course)
      create(:question, unit: unit_with_question)

      expect(content_coverage[:units_without_questions]).to eq(1)
    end

    it '論理削除済みの問題しかない単元は問題0件として数える' do
      unit = create(:unit, course: course)
      create(:question, unit: unit, deleted_at: Time.current)

      expect(content_coverage[:units_without_questions]).to eq(1)
    end

    it '問題はあるが期間内の解答が無い単元数を返す' do
      unit_with_answers = create(:unit, course: course)
      unit_without_answers = create(:unit, course: course)
      create(:question, unit: unit_with_answers)
      create(:question, unit: unit_without_answers)
      create_question_history_for(student, unit: unit_with_answers, course: course,
                                           answered_at: Time.zone.local(2026, 8, 20, 10))

      expect(content_coverage[:units_without_answers]).to eq(1)
    end

    it '問題が0件の単元はunits_without_answersに数えない(units_without_questionsとは排他)' do
      create(:unit, course: course)

      expect(content_coverage[:units_without_answers]).to eq(0)
    end

    it '期間外の解答しかない単元はunits_without_answersに数える' do
      unit = create(:unit, course: course)
      create(:question, unit: unit)
      create_question_history_for(student, unit: unit, course: course,
                                           answered_at: Time.zone.local(2026, 7, 1, 10))

      expect(content_coverage[:units_without_answers]).to eq(1)
    end

    it '論理削除済みの解答は数えない(単元は解答0件として扱う)' do
      unit = create(:unit, course: course)
      create(:question, unit: unit)
      create_question_history_for(student, unit: unit, course: course,
                                           answered_at: Time.zone.local(2026, 8, 20, 10),
                                           deleted_at: Time.current)

      expect(content_coverage[:units_without_answers]).to eq(1)
    end
  end

  describe '#meta' do
    subject(:meta) { described_class.new(from: from, to: to).meta }

    let(:from) { Date.new(2026, 8, 13) }
    let(:to) { Date.new(2026, 9, 11) }

    it '期間・前期間・定数を返す' do
      expect(meta).to include(
        from: from,
        to: to,
        previous_from: Date.new(2026, 7, 14),
        previous_to: Date.new(2026, 8, 12),
        min_answer_count: Admin::AnalyticsQuery::MIN_ANSWER_COUNT,
        ranking_limit: Admin::AnalyticsQuery::RANKING_LIMIT,
        max_range_days: Admin::AnalyticsQuery::MAX_RANGE_DAYS
      )
    end

    it 'generated_atを返す' do
      travel_to Time.zone.parse('2026-09-11 16:03:00') do
        expect(meta[:generated_at]).to eq(Time.zone.parse('2026-09-11 16:03:00'))
      end
    end
  end
end
