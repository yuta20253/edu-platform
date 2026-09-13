# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateInterviewRequestForm, type: :model do
  subject(:form) do
    described_class.new(
      user: student, teacher_id: teacher_id, reason_category: reason_category, reason_detail: reason_detail
    )
  end

  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:school_class) { create(:school_class, grade: grade) }
  let!(:student) do
    create(:user, :student, high_school: high_school, grade: grade, school_class: school_class)
  end
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:teacher_school_class) { create(:teacher_school_class, user: teacher, school_class: school_class) }
  let(:teacher_id) { teacher.id }
  let(:reason_category) { 'study_method' }
  let(:reason_detail) { '勉強方法について相談したい' }

  describe '#valid?' do
    context '正常系' do
      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'teacher_idが空の場合' do
      let(:teacher_id) { nil }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end

    context 'reason_categoryが不正な場合' do
      let(:reason_category) { 'invalid' }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end

    context 'reason_detailが空の場合' do
      let(:reason_detail) { '' }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end

    context '自分の所属クラスの担当ではない教員を指定した場合' do
      let!(:other_teacher) { create(:user, :teacher, high_school: high_school) }
      let(:teacher_id) { other_teacher.id }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?
        expect(form.errors[:teacher_id]).to include('申請可能な教員ではありません')
      end
    end
  end

  describe '#save' do
    context 'validな場合' do
      it 'serviceが呼ばれる' do
        service = instance_double(Student::CreateInterviewRequestService, call: true)

        allow(Student::CreateInterviewRequestService)
          .to receive(:new)
          .with(user: student, teacher_id: teacher_id, reason_category: reason_category, reason_detail: reason_detail)
          .and_return(service)

        form.save

        expect(service).to have_received(:call)
      end
    end

    context 'invalidな場合' do
      let(:reason_detail) { '' }

      it 'falseを返す' do
        expect(form.save).to be false
      end
    end

    context '同時作成によりDBのユニーク制約に違反した場合' do
      before do
        allow(Student::CreateInterviewRequestService).to receive(:new).and_raise(ActiveRecord::RecordNotUnique)
      end

      it 'falseを返す' do
        expect(form.save).to be false
      end

      it 'エラーメッセージが返る' do
        form.save
        expect(form.errors[:base]).to include('この教員との進行中の面談が既に存在します')
      end
    end
  end
end
