# frozen_string_literal: true

require 'rails_helper'

# お知らせのバリデーションエラーは full_messages で「項目名 + メッセージ」になる。
# 項目名の訳が無いと「Announcement targets 学年を指定してください」のように英語が混ざる。
RSpec.describe 'お知らせの項目名の訳' do
  attributes = %i[title content status scheduled_at announcement_targets]
  klasses = [Admin::AnnouncementForm, Teacher::CreateAnnouncementForm, Teacher::UpdateAnnouncementForm]

  klasses.each do |klass|
    attributes.each do |attribute|
      it "#{klass}の#{attribute}が日本語に訳されている" do
        expect(klass.human_attribute_name(attribute)).not_to match(/\A[A-Za-z ]+\z/)
      end
    end
  end

  it 'Announcementのstatusが日本語に訳されている' do
    expect(Announcement.human_attribute_name(:status)).not_to match(/\A[A-Za-z ]+\z/)
  end
end
