# == Schema Information
#
# Table name: teacher_permissions
#
#  id                    :bigint           not null, primary key
#  user_id               :bigint           not null
#  grade_scope           :integer
#  manage_other_teachers :boolean
#  created_at            :datetime         not null
#  updated_at            :datetime         not null
#
require 'rails_helper'

RSpec.describe TeacherPermission, type: :model do
  it 'teacherなら有効' do
    teacher = create(:user, :teacher)
    permission = build(:teacher_permission, user: teacher)

    expect(permission). to be_valid
  end

  it 'teacher以外なら無効' do
    admin = create(:user, :admin)
    permission = build(:teacher_permission, user: admin)

    expect(permission).to be_invalid

    expect(permission.errors[:user]).to include('教職員アカウントのみ設定可能です')
  end

  it "userがないと無効" do
    permission = build(:teacher_permission, user: nil)
    expect(permission).to be_invalid
  end

  it "不正なgrade_scopeはエラーになる" do
    teacher = create(:user, :teacher)

    expect {
      TeacherPermission.create!(
        user: teacher,
        grade_scope: 99
      )
    }.to raise_error(ArgumentError)
  end

  it "user削除でpermissionも削除される" do
    teacher = create(:user, :teacher)
    create(:teacher_permission, user: teacher)

    expect { teacher.destroy }.to change { TeacherPermission.count }.by(-1)
  end
end
