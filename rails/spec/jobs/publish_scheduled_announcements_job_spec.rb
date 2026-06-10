# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PublishScheduledAnnouncementsJob, type: :job do
  describe '#perform' do
    context '正常系' do
      it 'scheduledで期限を過ぎたお知らせがpublishedになる' do
        freeze_time do
          announcement = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          travel 2.minutes

          described_class.perform_now

          expect(announcement.reload.status).to eq('published')
        end
      end

      it 'published_atが設定される' do
        freeze_time do
          announcement = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          travel 2.minutes

          described_class.perform_now

          expect(announcement.reload.published_at).to eq(Time.current)
        end
      end

      it '複数のscheduledをまとめてpublishedにする' do
        freeze_time do
          announcement1 = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          announcement2 = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          travel 2.minutes

          described_class.perform_now

          expect(announcement1.reload.status).to eq('published')
          expect(announcement2.reload.status).to eq('published')
        end
      end
    end

    context '境界値' do
      it '公開時刻前ならpublishedにならない' do
        announcement = create(
          :announcement,
          :scheduled,
          scheduled_at: 1.minute.from_now
        )

        described_class.perform_now

        expect(announcement.reload.status).to eq('scheduled')
      end

      it 'scheduled_atが現在時刻と同じならpublishedになる' do
        freeze_time do
          announcement = create(
            :announcement,
            :scheduled,
            scheduled_at: Time.current
          )

          described_class.perform_now

          expect(announcement.reload.status).to eq('published')
        end
      end
    end

    it '1件失敗しても他のお知らせの処理は継続する' do
      freeze_time do
        announcement1 = create(
          :announcement,
          :scheduled,
          scheduled_at: 1.minute.from_now
        )

        announcement2 = create(
          :announcement,
          :scheduled,
          scheduled_at: 1.minute.from_now
        )

        travel 2.minutes

        failed_announcement = Announcement.find(announcement1.id)
        success_announcement = Announcement.find(announcement2.id)

        allow(failed_announcement).to receive(:update!)
          .and_raise(StandardError, 'test error')

        allow(success_announcement).to receive(:update!)
          .and_call_original

        relation = instance_double(ActiveRecord::Relation)

        allow(Announcement).to receive(:scheduled).and_return(relation)

        allow(relation).to receive(:where)
          .with(scheduled_at: ..Time.current)
          .and_return(relation)

        allow(relation).to receive(:find_each).and_yield(failed_announcement).and_yield(success_announcement)

        expect do
          described_class.perform_now
        end.not_to raise_error

        expect(announcement1.reload.status).to eq('scheduled')
        expect(announcement2.reload.status).to eq('published')
      end
    end
  end
end
