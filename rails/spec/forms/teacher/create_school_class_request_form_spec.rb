# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateSchoolClassRequestForm, type: :model do
  subject(:form) do
    described_class.new(
      user: user,
      name: name,
      grade_id: grade_id,
      action: action,
      school_class_id: school_class_id
    )
  end

  let!(:high_school) { create(:high_school) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let(:user) { teacher }
  let!(:grade) { create(:grade, high_school: high_school) }
  let(:grade_id) { grade.id }
  let(:action) { 'creation' }
  let(:name) { '1組' }
  let(:school_class_id) { nil }

  describe '#valid?' do
    context '正常系' do
      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'nameが空でactionがcreationの場合' do
      let(:name) { '' }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:name]).to include('を入力してください')
      end
    end

    context 'nameが空でactionがmodificationの場合' do
      let(:name) { '' }
      let(:action) { 'modification' }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:name]).to include('を入力してください')
      end
    end

    context 'nameが空でactionがdeletionの場合' do
      let(:name) { '' }
      let(:action) { 'deletion' }

      it 'validになる(nameのバリデーション対象外)' do
        expect(form).to be_valid
      end
    end

    context 'nameが256文字の場合' do
      let(:name) { 'あ' * 256 }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:name]).to be_present
      end
    end

    context 'nameが255文字(境界値)の場合' do
      let(:name) { 'あ' * 255 }

      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'grade_idが空の場合' do
      let(:grade_id) { nil }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:grade_id]).to include('を入力してください')
      end
    end

    context 'actionが不正な値の場合' do
      let(:action) { 'invalid' }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:action]).to be_present
      end
    end

    context '他高校のgrade_idを指定した場合' do
      let!(:other_high_school) { create(:high_school) }
      let!(:other_grade) { create(:grade, high_school: other_high_school) }
      let(:grade_id) { other_grade.id }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:grade_id]).to include('学年IDが存在しません')
      end
    end

    context 'school_class_idが指定したgradeに属さない場合' do
      let!(:other_grade) { create(:grade, high_school: high_school) }
      let!(:other_school_class) { create(:school_class, grade: other_grade) }
      let(:school_class_id) { other_school_class.id }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:school_class_id]).to include('学年が一致しません')
      end
    end

    context 'school_class_idが指定したgradeに属する場合' do
      let!(:school_class) { create(:school_class, grade: grade) }
      let(:school_class_id) { school_class.id }

      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'actionがdeletionで在籍者チェックを行う場合' do
      let(:action) { 'deletion' }
      let(:name) { '' }
      let!(:school_class) { create(:school_class, grade: grade) }
      let(:school_class_id) { school_class.id }

      context '所属する生徒も教員もいない場合' do
        it 'validになる' do
          expect(form).to be_valid
        end
      end

      context '所属する生徒がいる場合' do
        let!(:student) do
          create(:user, :student, high_school: high_school, grade: grade, school_class: school_class)
        end

        it 'invalidになる' do
          expect(form).not_to be_valid
        end

        it 'エラーが追加される' do
          form.valid?

          expect(form.errors[:school_class_id]).to include('生徒または教員が所属しているため削除できません')
        end
      end

      context '所属する教員がいる場合' do
        let!(:homeroom_teacher) { create(:user, :teacher, high_school: high_school) }
        let!(:teacher_school_class) do
          create(:teacher_school_class, user: homeroom_teacher, school_class: school_class)
        end

        it 'invalidになる' do
          expect(form).not_to be_valid
        end

        it 'エラーが追加される' do
          form.valid?

          expect(form.errors[:school_class_id]).to include('生徒または教員が所属しているため削除できません')
        end
      end
    end
  end

  describe '#save' do
    context 'validな場合' do
      it 'serviceが呼ばれる' do
        service = instance_double(Teacher::CreateSchoolClassRequestService, call: true)

        allow(Teacher::CreateSchoolClassRequestService)
          .to receive(:new)
          .with(user: user, attributes: form.attributes)
          .and_return(service)

        form.save

        expect(service).to have_received(:call)
      end

      it 'trueを返す' do
        service = instance_double(Teacher::CreateSchoolClassRequestService, call: true)

        allow(Teacher::CreateSchoolClassRequestService).to receive(:new).and_return(service)

        expect(form.save).to be true
      end
    end

    context 'invalidな場合' do
      let(:name) { '' }

      it 'falseを返す' do
        expect(form.save).to be false
      end

      it 'serviceが呼ばれない' do
        allow(Teacher::CreateSchoolClassRequestService).to receive(:new)

        form.save

        expect(Teacher::CreateSchoolClassRequestService).not_to have_received(:new)
      end
    end
  end
end
