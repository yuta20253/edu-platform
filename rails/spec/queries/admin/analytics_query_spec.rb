# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AnalyticsQuery, type: :model do
  def create_question_history_for(user, **attrs)
    create(:question_history, user: user, task: create(:task, user: user), **attrs)
  end

  def create_study_log_for(user, **attrs)
    create(:study_log, user: user, task: create(:task, user: user), **attrs)
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
end
