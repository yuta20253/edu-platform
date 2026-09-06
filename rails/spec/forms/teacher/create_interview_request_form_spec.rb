# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateInterviewRequestForm, type: :model do
  subject(:form) do
    described_class.new(user: teacher, student_id: student_id, reason_detail: reason_detail)
  end

  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:teacher) do
    create(:user, :teacher, high_school: high_school).tap do |t|
      create(:teacher_permission, user: t, grade_scope: :all_grades)
    end
  end
  let!(:student) { create(:user, :student, high_school: high_school, grade: grade) }
  let(:student_id) { student.id }
  let(:reason_detail) { '最近元気がなさそうなので話を聞きたい' }

  describe '#valid?' do
    context '正常系' do
      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'student_idが空の場合' do
      let(:student_id) { nil }

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

    context '他校の生徒を指定した場合' do
      let!(:other_high_school) { create(:high_school) }
      let!(:other_grade) { create(:grade, high_school: other_high_school) }
      let!(:other_student) { create(:user, :student, high_school: other_high_school, grade: other_grade) }
      let(:student_id) { other_student.id }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?
        expect(form.errors[:student_id]).to include('担当外の生徒です')
      end
    end

    context '担当学年が限定されている教員が担当外学年の生徒を指定した場合' do
      subject(:form) do
        described_class.new(user: own_grade_teacher, student_id: other_grade_student.id, reason_detail: reason_detail)
      end

      let!(:own_grade_teacher) do
        create(:user, :teacher, high_school: high_school, grade: grade).tap do |t|
          create(:teacher_permission, user: t, grade_scope: :own_grade)
        end
      end
      let!(:other_grade) { create(:grade, high_school: high_school) }
      let!(:other_grade_student) { create(:user, :student, high_school: high_school, grade: other_grade) }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end
    end
  end

  describe '#save' do
    context 'validな場合' do
      it 'serviceが呼ばれる' do
        service = instance_double(Teacher::CreateInterviewRequestService, call: true)

        allow(Teacher::CreateInterviewRequestService)
          .to receive(:new)
          .with(user: teacher, student_id: student_id, reason_detail: reason_detail)
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

      it 'serviceが呼ばれない' do
        allow(Teacher::CreateInterviewRequestService).to receive(:new)

        form.save

        expect(Teacher::CreateInterviewRequestService).not_to have_received(:new)
      end
    end

    context '同じ生徒との進行中の面談が既に存在する場合' do
      let!(:existing_request) do
        create(:interview_request, :initiated_by_teacher, student: student, teacher: teacher, status: :requested)
      end

      it 'falseを返す' do
        expect(form.save).to be false
      end

      it 'モデルのバリデーションエラーがフォームに反映される' do
        form.save
        expect(form.errors[:base]).to include('この生徒との進行中の面談が既に存在します')
      end
    end

    context '同時作成によりDBのユニーク制約に違反した場合' do
      before do
        allow(Teacher::CreateInterviewRequestService).to receive(:new).and_raise(ActiveRecord::RecordNotUnique)
      end

      it 'falseを返す' do
        expect(form.save).to be false
      end

      it 'エラーメッセージが返る' do
        form.save
        expect(form.errors[:base]).to include('この生徒との進行中の面談が既に存在します')
      end
    end
  end
end
