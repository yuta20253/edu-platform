# frozen_string_literal: true

# == Schema Information
#
# Table name: interview_requests
#
#  id              :bigint           not null, primary key
#  student_id      :bigint           not null
#  teacher_id      :bigint           not null
#  initiator_id    :bigint           not null
#  initiator_role  :integer          not null
#  status          :integer          default("requested"), not null
#  reason_category :integer
#  reason_detail   :text(65535)      not null
#  scheduled_at    :datetime
#  completed_at    :datetime
#  cancelled_at    :datetime
#  cancelled_by_id :bigint
#  cancel_reason   :text(65535)
#  lock_version    :integer          default(0), not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  active_pair_key :string(255)
#
require 'rails_helper'

RSpec.describe InterviewRequest, type: :model do
  describe 'enum' do
    it do
      expect(subject).to define_enum_for(:status).with_values(
        requested: 0,
        scheduling: 1,
        confirmed: 2,
        completed: 3,
        cancelled: 4
      )
    end

    it do
      expect(subject).to define_enum_for(:initiator_role).with_values(
        teacher: 0,
        student: 1
      ).with_prefix(true)
    end

    it do
      expect(subject).to define_enum_for(:reason_category).with_values(
        study_method: 0,
        study_plan: 1,
        academic_performance: 2,
        career: 3,
        school_life: 4,
        mental: 5,
        other: 6
      )
    end
  end

  describe '#validate (reason_categoryの出し分け)' do
    context '教員起点の場合' do
      let(:request) { build(:interview_request, :initiated_by_teacher, reason_category: nil) }

      it 'reason_categoryが無くてもvalidになる' do
        expect(request).to be_valid
      end

      it 'reason_categoryが設定されているとinvalidになる' do
        request.reason_category = :study_method
        expect(request).not_to be_valid
      end
    end

    context '生徒起点の場合' do
      let(:request) { build(:interview_request, :initiated_by_student) }

      it 'reason_categoryが設定されていればvalidになる' do
        expect(request).to be_valid
      end

      it 'reason_categoryが無いとinvalidになる' do
        request.reason_category = nil
        expect(request).not_to be_valid
      end
    end
  end

  describe '#validate (student/teacherのロール)' do
    it '対象がstudentロールでない場合invalidになる' do
      request = build(:interview_request, student: create(:user, :teacher))
      expect(request).not_to be_valid
    end

    it '担当がteacherロールでない場合invalidになる' do
      request = build(:interview_request, teacher: create(:user, :student))
      expect(request).not_to be_valid
    end
  end

  describe '#validate (同一student×teacherのactive申請の重複禁止)' do
    let!(:student) { create(:user, :student) }
    let!(:teacher) { create(:user, :teacher) }

    context '同じペアでactive(requested/scheduling/confirmed)な申請が既に存在する場合' do
      let!(:existing_request) do
        create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :scheduling)
      end

      let(:new_request) { build(:interview_request, :initiated_by_teacher, student: student, teacher: teacher) }

      it 'invalidになる' do
        expect(new_request).not_to be_valid
      end

      it 'エラーが追加される' do
        new_request.valid?
        expect(new_request.errors[:base]).to include('この生徒との進行中の面談が既に存在します')
      end
    end

    context '同じペアの既存申請がcompleted/cancelledの場合' do
      let!(:existing_request) do
        create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :cancelled)
      end

      let(:new_request) { build(:interview_request, :initiated_by_teacher, student: student, teacher: teacher) }

      it 'validになる' do
        expect(new_request).to be_valid
      end
    end

    context '自分自身が既存のactive申請である場合' do
      let!(:existing_request) do
        create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :requested)
      end

      it 'validになる(自分自身は除外される)' do
        expect(existing_request).to be_valid
      end
    end

    context 'モデルバリデーションを迂回して同時作成された場合(DB制約による防止)' do
      it 'active_pair_keyのユニークインデックスによりRecordNotUniqueが発生する' do
        create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :requested)

        duplicate = build(:interview_request, :initiated_by_teacher, student: student, teacher: teacher)

        expect { duplicate.save!(validate: false) }.to raise_error(ActiveRecord::RecordNotUnique)
      end

      it 'active/active以外の組み合わせなら制約に引っかからない' do
        create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :cancelled)

        duplicate = build(:interview_request, :initiated_by_teacher, student: student, teacher: teacher)

        expect { duplicate.save!(validate: false) }.not_to raise_error
      end
    end
  end

  describe '#validate (ステータス遷移)' do
    %w[requested scheduling confirmed completed cancelled].each do |from|
      InterviewRequest::STATUS_TRANSITIONS[from].each do |to|
        it "#{from} から #{to} への遷移はvalid" do
          request = create(:interview_request, :initiated_by_teacher, status: from)
          request.status = to
          expect(request).to be_valid
        end
      end

      (described_class.statuses.keys - described_class::STATUS_TRANSITIONS[from] - [from]).each do |to|
        it "#{from} から #{to} への遷移はinvalid" do
          request = create(:interview_request, :initiated_by_teacher, status: from)
          request.status = to
          expect(request).not_to be_valid
        end
      end
    end
  end
end
