# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AnnouncementForm do
  let(:admin) { create(:user, :admin, high_school: nil) }

  describe '#save (作成)' do
    subject(:form) { described_class.new(publisher: admin, **params) }

    context '正常なパラメータの場合' do
      let(:params) { { title: 'システムメンテナンスのお知らせ', content: 'メンテナンスを実施します。', status: 'draft' } }

      it '保存に成功する' do
        expect(form.save).to be true
      end

      it 'announcementが作成される' do
        expect { form.save }.to change(Announcement, :count).by(1)
      end

      it 'resultにannouncementが設定される' do
        form.save
        expect(form.result).to be_a(Announcement)
      end

      it 'all_usersターゲットが1件作成される' do
        form.save
        expect(form.result.announcement_targets.first.target_type).to eq('all_users')
      end
    end

    context 'status: scheduledでscheduled_atを指定した場合' do
      let(:params) do
        { title: 'タイトル', content: '内容', status: 'scheduled', scheduled_at: 1.day.from_now }
      end

      it 'scheduledで作成される' do
        form.save
        expect(form.result.status).to eq('scheduled')
      end
    end

    context 'titleが空の場合' do
      let(:params) { { title: '', content: '内容', status: 'draft' } }

      it '保存に失敗する' do
        expect(form.save).to be false
      end

      it 'announcementが作成されない' do
        expect { form.save }.not_to change(Announcement, :count)
      end

      it 'errorsにtitleのエラーが含まれる' do
        form.save
        expect(form.errors[:title]).to be_present
      end
    end

    context 'contentが空の場合' do
      let(:params) { { title: 'タイトル', content: '', status: 'draft' } }

      it '保存に失敗する' do
        expect(form.save).to be false
      end
    end

    context 'statusが不正な場合' do
      let(:params) { { title: 'タイトル', content: '内容', status: 'invalid' } }

      it '保存に失敗する' do
        expect(form.save).to be false
      end

      it 'ArgumentErrorを発生させない' do
        expect { form.save }.not_to raise_error
      end

      it 'announcementが作成されない' do
        expect { form.save }.not_to change(Announcement, :count)
      end
    end

    context 'status: scheduledでscheduled_atが過去日時の場合' do
      let(:params) { { title: 'タイトル', content: '内容', status: 'scheduled', scheduled_at: 1.day.ago } }

      it '保存に失敗する' do
        expect(form.save).to be false
      end

      it 'errorsにscheduled_atのエラーが含まれる' do
        form.save
        expect(form.errors[:scheduled_at]).to be_present
      end
    end
  end

  describe '#save (更新)' do
    subject(:form) { described_class.new(announcement: announcement, **params) }

    context 'draftのお知らせを更新する場合' do
      let(:announcement) { create(:announcement, publisher: admin, title: '旧タイトル', content: '旧内容') }
      let(:params) { { title: '新タイトル', content: '新内容' } }

      it '保存に成功する' do
        expect(form.save).to be true
      end

      it 'titleとcontentが更新される' do
        form.save
        expect(announcement.reload.title).to eq('新タイトル')
        expect(announcement.reload.content).to eq('新内容')
      end

      it 'resultにannouncementが設定される' do
        form.save
        expect(form.result).to eq(announcement)
      end
    end

    context 'titleを空文字で更新しようとした場合' do
      let(:announcement) { create(:announcement, publisher: admin, title: '旧タイトル') }
      let(:params) { { title: '' } }

      it '保存に失敗する' do
        expect(form.save).to be false
      end

      it 'errorsにtitleのエラーが含まれる' do
        form.save
        expect(form.errors[:title]).to be_present
      end

      it 'titleが更新されない' do
        form.save
        expect(announcement.reload.title).to eq('旧タイトル')
      end
    end

    context 'contentを空文字で更新しようとした場合' do
      let(:announcement) { create(:announcement, publisher: admin, content: '旧内容') }
      let(:params) { { content: '' } }

      it '保存に失敗する' do
        expect(form.save).to be false
      end

      it 'errorsにcontentのエラーが含まれる' do
        form.save
        expect(form.errors[:content]).to be_present
      end
    end

    context 'statusをscheduledに変更しscheduled_atを指定する場合' do
      let(:announcement) { create(:announcement, publisher: admin) }
      let(:params) { { status: 'scheduled', scheduled_at: 1.day.from_now } }

      it 'scheduledに更新される' do
        form.save
        expect(announcement.reload.status).to eq('scheduled')
      end
    end

    context 'すでにpublishedのお知らせを更新しようとした場合' do
      let(:announcement) { create(:announcement, publisher: admin, status: :published) }
      let(:params) { { title: '新タイトル' } }

      it '保存に失敗する' do
        expect(form.save).to be false
      end

      it 'titleが更新されない' do
        form.save
        expect(announcement.reload.title).not_to eq('新タイトル')
      end
    end

    context 'statusが不正な場合' do
      let(:announcement) { create(:announcement, publisher: admin) }
      let(:params) { { status: 'invalid' } }

      it '保存に失敗する' do
        expect(form.save).to be false
      end

      it 'ArgumentErrorを発生させない' do
        expect { form.save }.not_to raise_error
      end
    end
  end
end
