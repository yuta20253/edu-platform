# frozen_string_literal: true

# == Schema Information
#
# Table name: tasks
#
#  id             :bigint           not null, primary key
#  user_id        :bigint           not null
#  goal_id        :bigint
#  title          :string(100)      not null
#  content        :text(65535)      not null
#  priority       :integer          default("normal"), not null
#  due_date       :date
#  estimated_time :integer
#  status         :integer          default("not_started"), not null
#  memo           :text(65535)
#  completed_at   :datetime
#  deleted_at     :datetime
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#
FactoryBot.define do
  factory :task do
    title { 'テストタスク' }
    content { 'テスト内容' }
    priority { :normal }
    status { :not_started }

    due_date { Time.zone.today + 1.day }
  end
end
