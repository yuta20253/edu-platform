# frozen_string_literal: true

# == Schema Information
#
# Table name: school_class_requests
#
#  id              :bigint           not null, primary key
#  school_class_id :bigint
#  applicant_id    :bigint           not null
#  approver_id     :bigint
#  grade_id        :bigint           not null
#  action          :integer          not null
#  status          :integer          default("pending"), not null
#  name            :string(255)
#  approved_at     :datetime
#  cancelled_at    :datetime
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  lock_version    :integer          default(0), not null
#  reason          :text(65535)
#
require 'rails_helper'

RSpec.describe SchoolClassRequest, type: :model do
  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school) }
  let!(:school_class) { create(:school_class, grade: grade) }

  describe '#validate (同一school_class_idのpending申請の重複禁止)' do
    context '同じschool_class_idでpendingの申請が既に存在する場合' do
      let!(:existing_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: school_class,
          action: :modification,
          status: :pending,
          name: '2組'
        )
      end

      let(:new_request) do
        build(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: school_class,
          action: :deletion,
          status: :pending
        )
      end

      it 'invalidになる' do
        expect(new_request).not_to be_valid
      end

      it 'エラーが追加される' do
        new_request.valid?

        expect(new_request.errors[:school_class_id]).to include('に対して承認待ちの申請が既に存在します')
      end
    end

    context '同じschool_class_idの既存申請がpendingではない場合' do
      let!(:approved_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: school_class,
          action: :modification,
          status: :approved,
          name: '2組'
        )
      end

      let(:new_request) do
        build(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: school_class,
          action: :deletion,
          status: :pending
        )
      end

      it 'validになる' do
        expect(new_request).to be_valid
      end
    end

    context 'school_class_idがnilの場合(新規作成申請)' do
      let!(:existing_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: nil,
          action: :creation,
          status: :pending,
          name: '3組'
        )
      end

      let(:new_request) do
        build(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: nil,
          action: :creation,
          status: :pending,
          name: '4組'
        )
      end

      it 'validになる(重複チェック対象外)' do
        expect(new_request).to be_valid
      end
    end

    context '自分自身が既存のpending申請である場合' do
      let!(:existing_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: school_class,
          action: :modification,
          status: :pending,
          name: '2組'
        )
      end

      it 'validになる(自分自身は除外される)' do
        expect(existing_request).to be_valid
      end
    end
  end
end
