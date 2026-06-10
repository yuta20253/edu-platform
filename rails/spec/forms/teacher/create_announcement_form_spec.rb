# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateAnnouncementForm, type: :model do
  subject(:form) do
    described_class.new(
      current_user: teacher,
      title: title,
      content: content,
      announcement_targets: announcement_targets
    )
  end

  let!(:teacher) { create(:user, :teacher) }

  let(:announcement_targets) do
    [
      {
        'target_type' => 'by_school'
      }
    ]
  end

  describe '#valid?' do
    context '正常系' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }

      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'titleが空' do
      let(:title) { '' }
      let(:content) { 'テスト内容' }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:title]).to include('を入力してください')
      end
    end

    context 'contentが空' do
      let(:title) { 'テストタイトル' }
      let(:content) { '' }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:content]).to include('を入力してください')
      end
    end

    context 'announcement_targetsが空' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:announcement_targets) { nil }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:announcement_targets]).to include('を入力してください')
      end
    end

    context 'announcement_targetsが配列ではない' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:announcement_targets) { 'by_school' }

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:announcement_targets]).to include('配列で指定してください')
      end
    end

    context '不正なtarget_type' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }

      let(:announcement_targets) do
        [
          {
            'target_type' => 'invalid'
          }
        ]
      end

      it 'invalidになる' do
        expect(form).not_to be_valid
      end

      it 'エラーが追加される' do
        form.valid?

        expect(form.errors[:base]).to include('不正なtarget_typeが含まれています')
      end
    end

    context 'teacher_permissionがown_gradeの場合' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_grade',
            'grade_id' => create(:grade).id,
            'user_role_id' => teacher.user_role_id
          }
        ]
      end

      let(:permission) { instance_double(TeacherPermission, own_grade?: true) }

      before do
        allow(teacher).to receive(:teacher_permission).and_return(permission)
      end

      it '指定できない学年のエラーになる' do
        expect(form).not_to be_valid
        expect(form.errors[:announcement_targets]).to include('指定できない学年です')
      end
    end

    context 'by_gradeでgrade_idが存在しない場合' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_grade',
            'grade_id' => 0,
            'user_role_id' => teacher.user_role_id
          }
        ]
      end

      it '存在しない学年のエラーになる' do
        expect(form).not_to be_valid
        expect(form.errors[:announcement_targets]).to include('存在しない学年です')
      end
    end

    context 'by_gradeで正常系' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:grade) { create(:grade, high_school: teacher.high_school) }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_grade',
            'grade_id' => grade.id,
            'user_role_id' => UserRole.names[:teacher]
          }
        ]
      end

      let(:permission) { instance_double(TeacherPermission, own_grade?: false) }

      before do
        allow(teacher).to receive(:teacher_permission).and_return(permission)
      end

      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'by_roleでuser_role_idが存在しない場合' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_role',
            'user_role_id' => 9999
          }
        ]
      end

      it '存在しない権限のエラーになる' do
        expect(form).not_to be_valid
        expect(form.errors[:announcement_targets]).to include('存在しない権限です')
      end
    end

    context 'by_roleで正常系' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_role',
            'user_role_id' => UserRole.names[:teacher]
          }
        ]
      end

      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'by_userでuser_idが存在しない場合' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_user',
            'user_id' => 0
          }
        ]
      end

      it '存在しないユーザーのエラーになる' do
        expect(form).not_to be_valid
        expect(form.errors[:announcement_targets]).to include('存在しないユーザーです')
      end
    end

    context 'by_userで正常系' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:other_user) { create(:user, high_school: teacher.high_school) }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_user',
            'user_id' => other_user.id
          }
        ]
      end

      it 'validになる' do
        expect(form).to be_valid
      end
    end

    context 'by_userで他校のユーザーを指定' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:other_high_school) { create(:high_school) }
      let(:other_user) { create(:user, high_school: other_high_school) }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_user',
            'user_id' => other_user.id
          }
        ]
      end

      it 'エラーになる' do
        expect(form).not_to be_valid
        expect(form.errors[:announcement_targets]).to include('他校のユーザーは指定できません')
      end
    end

    context 'by_gradeで他校の学年を指定' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:other_high_school) { create(:high_school) }
      let(:other_grade) { create(:grade, high_school: other_high_school) }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_grade',
            'grade_id' => other_grade.id,
            'user_role_id' => UserRole.names[:teacher]
          }
        ]
      end

      let(:permission) { instance_double(TeacherPermission, own_grade?: false) }

      before do
        allow(teacher).to receive(:teacher_permission).and_return(permission)
      end

      it 'エラーになる' do
        expect(form).not_to be_valid
        expect(form.errors[:announcement_targets]).to include('他校の学年は指定できません')
      end
    end

    context '複数のアナウンスターゲット' do
      let(:title) { 'テストタイトル' }
      let(:content) { 'テスト内容' }
      let(:grade) { create(:grade, high_school: teacher.high_school) }
      let(:other_user) { create(:user, high_school: teacher.high_school) }
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_school'
          },
          {
            'target_type' => 'by_grade',
            'grade_id' => grade.id,
            'user_role_id' => UserRole.names[:teacher]
          },
          {
            'target_type' => 'by_user',
            'user_id' => other_user.id
          }
        ]
      end

      let(:permission) { instance_double(TeacherPermission, own_grade?: false) }

      before do
        allow(teacher).to receive(:teacher_permission).and_return(permission)
      end

      it 'validになる' do
        expect(form).to be_valid
      end
    end
  end

  describe '#save' do
    let(:title) { 'テストタイトル' }
    let(:content) { 'テスト内容' }

    context 'validな場合' do
      it 'serviceが呼ばれる' do
        service = instance_double(Teacher::CreateAnnouncementService)

        allow(Teacher::CreateAnnouncementService)
          .to receive(:new)
          .with(form)
          .and_return(service)

        allow(service).to receive(:call)

        form.save

        expect(service).to have_received(:call)
      end

      it 'trueを返す' do
        service = instance_double(Teacher::CreateAnnouncementService, call: true)

        allow(Teacher::CreateAnnouncementService)
          .to receive(:new)
          .and_return(service)

        expect(form.save).to be true
      end
    end

    context 'invalidな場合' do
      let(:title) { '' }

      it 'falseを返す' do
        expect(form.save).to be false
      end

      it 'serviceが呼ばれない' do
        allow(Teacher::CreateAnnouncementService)
          .to receive(:new)

        form.save

        expect(Teacher::CreateAnnouncementService)
          .not_to have_received(:new)
      end
    end
  end
end
