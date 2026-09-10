# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::DashboardQuery, type: :model do
  subject(:query) { described_class.new }

  let!(:admin) { create(:user, :admin, high_school: nil) }

  # task ファクトリは user を持たないため、学習ログ・解答履歴は
  # 本人のタスクにぶら下げて作る。
  def create_study_log_for(user, **attrs)
    create(:study_log, user: user, task: create(:task, user: user), **attrs)
  end

  def create_question_history_for(user, **attrs)
    create(:question_history, user: user, task: create(:task, user: user), **attrs)
  end

  describe '#stats' do
    describe ':student_count / :teacher_count / :admin_count' do
      before do
        create_list(:user, 3)
        create_list(:user, 2, :teacher)
      end

      it '有効かつ招待受諾済みのユーザーをロールごとに数える' do
        expect(query.stats).to include(student_count: 3, teacher_count: 2, admin_count: 1)
      end

      it '論理削除済みのユーザーを数えない' do
        create(:user, deleted_at: Time.current)
        create(:user, :teacher, deleted_at: Time.current)

        expect(query.stats).to include(student_count: 3, teacher_count: 2)
      end

      it '招待未受諾（password_reset_required）のユーザーを数えない' do
        create(:user, :invitation_pending)
        create(:user, :teacher, :invitation_pending)

        expect(query.stats).to include(student_count: 3, teacher_count: 2)
      end
    end

    describe ':pending_student_count / :pending_teacher_count' do
      it '招待未受諾のユーザーをロールごとに数える' do
        create_list(:user, 2, :invitation_pending)
        create(:user, :teacher, :invitation_pending)

        expect(query.stats).to include(pending_student_count: 2, pending_teacher_count: 1)
      end

      it '論理削除済みの招待未受諾ユーザーを数えない' do
        create(:user, :invitation_pending, deleted_at: Time.current)

        expect(query.stats).to include(pending_student_count: 0)
      end

      it '招待未受諾がいない場合は0を返す' do
        create(:user)

        expect(query.stats).to include(pending_student_count: 0, pending_teacher_count: 0)
      end
    end

    describe ':total_questions' do
      let!(:unit) { create(:unit) }

      it '問題の総数を返す' do
        create_list(:question, 4, unit: unit)

        expect(query.stats).to include(total_questions: 4)
      end

      # CSVインポートの上書きモード（Admin::QuestionCsvBatchImportService）は
      # 既存問題を論理削除するため、単純な Question.count では上書きのたびに
      # 総問題数が水増しされる。
      it '論理削除済みの問題を数えない' do
        create_list(:question, 2, unit: unit)
        create(:question, unit: unit, deleted_at: Time.current)

        expect(query.stats).to include(total_questions: 2)
      end
    end

    describe ':active_student_count' do
      let!(:student) { create(:user) }

      it '30日以内に学習ログがある生徒を数える' do
        create_study_log_for(student, started_at: 10.days.ago)

        expect(query.stats).to include(active_student_count: 1)
      end

      it '30日以内に解答履歴がある生徒を数える' do
        create_question_history_for(student, answered_at: 10.days.ago)

        expect(query.stats).to include(active_student_count: 1)
      end

      it '学習ログと解答履歴の両方がある生徒を二重に数えない' do
        create_study_log_for(student, started_at: 10.days.ago)
        create_question_history_for(student, answered_at: 5.days.ago)

        expect(query.stats).to include(active_student_count: 1)
      end

      it '31日前の活動しかない生徒を数えない' do
        create_study_log_for(student, started_at: 31.days.ago)
        create_question_history_for(student, answered_at: 31.days.ago)

        expect(query.stats).to include(active_student_count: 0)
      end

      it '活動がまったくない生徒を数えない' do
        expect(query.stats).to include(active_student_count: 0)
      end

      it '論理削除済みの活動しかない生徒を数えない' do
        create_study_log_for(student, started_at: 10.days.ago, deleted_at: Time.current)
        create_question_history_for(student, answered_at: 10.days.ago, deleted_at: Time.current)

        expect(query.stats).to include(active_student_count: 0)
      end

      it '論理削除済みの生徒は活動があっても数えない' do
        student.update!(deleted_at: Time.current)
        create_study_log_for(student, started_at: 10.days.ago)

        expect(query.stats).to include(active_student_count: 0)
      end

      it '招待未受諾の生徒は活動があっても数えない' do
        student.update!(password_reset_required: true)
        create_study_log_for(student, started_at: 10.days.ago)

        expect(query.stats).to include(active_student_count: 0)
      end

      it '活動のある教師を生徒として数えない' do
        teacher = create(:user, :teacher)
        create_study_log_for(teacher, started_at: 10.days.ago)

        expect(query.stats).to include(active_student_count: 0)
      end
    end

    context 'active_within_days を指定した場合' do
      let!(:student) { create(:user) }

      it '指定した日数で活動を判定する' do
        create_study_log_for(student, started_at: 10.days.ago)

        expect(described_class.new(active_within_days: 7).stats).to include(active_student_count: 0)
        expect(described_class.new(active_within_days: 60).stats).to include(active_student_count: 1)
      end
    end
  end

  describe '#recent_imports' do
    let!(:unit) { create(:unit) }

    it '作成日時の降順で最大5件返す' do
      imports = create_list(:import_history, 6, user: admin, unit: unit)

      expect(query.recent_imports.to_a).to eq(imports.last(5).reverse)
    end

    it '生徒CSVのインポート履歴を含めない' do
      student_import = create(:import_history, user: admin, unit: nil, import_type: :student)

      expect(query.recent_imports).not_to include(student_import)
    end

    it '論理削除済みのインポート履歴を含めない' do
      deleted = create(:import_history, user: admin, unit: unit, deleted_at: Time.current)

      expect(query.recent_imports).not_to include(deleted)
    end
  end

  describe '#recent_announcements' do
    it '作成日時の降順で最大3件返す' do
      announcements = Array.new(4) do |i|
        create(:announcement, publisher: admin, created_at: i.days.ago)
      end

      expect(query.recent_announcements.to_a).to eq(announcements.first(3))
    end

    it 'ステータスで絞り込まない' do
      draft = create(:announcement, publisher: admin)
      scheduled = create(:announcement, :scheduled, publisher: admin)
      published = create(:announcement, publisher: admin, status: :published)

      expect(query.recent_announcements).to contain_exactly(draft, scheduled, published)
    end

    it '管理者以外が発行したお知らせを含めない' do
      teacher_announcement = create(:announcement, publisher: create(:user, :teacher))

      expect(query.recent_announcements).not_to include(teacher_announcement)
    end
  end

  describe '#active_within_days' do
    it 'デフォルトは30日' do
      expect(query.active_within_days).to eq(30)
    end

    it '指定した日数を返す' do
      expect(described_class.new(active_within_days: 7).active_within_days).to eq(7)
    end
  end
end
