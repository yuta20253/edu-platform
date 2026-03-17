# frozen_string_literal: true

# == Schema Information
#
# Table name: import_histories
#
#  id            :bigint           not null, primary key
#  user_id       :bigint           not null
#  unit_id       :bigint           not null
#  file_name     :string(255)      not null
#  file_size     :bigint
#  content_type  :string(255)
#  status        :integer          default("pending"), not null
#  total_count   :integer          default(0), not null
#  success_count :integer          default(0), not null
#  error_count   :integer          default(0), not null
#  started_at    :datetime
#  finished_at   :datetime
#  deleted_at    :datetime
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
FactoryBot.define do
  factory :import_history do
    association :user
    association :unit
    file_name { 'questions.csv' }

    after(:build) do |history|
      history.file.attach(
        io: StringIO.new("問題文,正解番号,解説,選択肢1,選択肢2,選択肢3,選択肢4\n問題1,1,解説,A,B,C,D"),
        filename: 'questions.csv',
        content_type: 'text/csv'
      )
    end
  end
end
