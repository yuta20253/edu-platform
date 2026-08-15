# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CancelSchoolClassRequestService do
  subject(:service) { described_class.new(user: applicant, id: school_class_request.id) }

  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school) }

  let!(:school_class_request) do
    create(
      :school_class_request,
      applicant: applicant,
      grade: grade,
      action: :creation,
      status: :pending,
      name: '1組'
    )
  end

  describe '#call' do
    context 'pendingの申請の場合' do
      it '真を返す' do
        expect(service.call).to be_truthy
      end

      it 'ステータスがcancelledになる' do
        service.call

        expect(school_class_request.reload.status).to eq('cancelled')
      end

      it 'cancelled_atが保存される' do
        service.call

        expect(school_class_request.reload.cancelled_at).to be_present
      end
    end

    context '異常系' do
      context '申請がpendingではない場合' do
        before do
          school_class_request.update!(status: :approved)
        end

        it 'falseを返す' do
          expect(service.call).to be false
        end

        it '更新されない' do
          expect { service.call }.not_to(change { school_class_request.reload.updated_at })
        end
      end

      context '申請者本人以外が取り消そうとした場合' do
        subject(:service) { described_class.new(user: other_teacher, id: school_class_request.id) }

        let!(:other_teacher) { create(:user, :teacher, high_school: high_school) }

        it 'RecordNotFoundが発生する' do
          expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
        end

        it '申請が更新されない' do
          expect do
            begin
              service.call
            rescue ActiveRecord::RecordNotFound
              nil
            end
          end.not_to(change { school_class_request.reload.status })
        end
      end

      context '存在しない申請の場合' do
        subject(:service) { described_class.new(user: applicant, id: 999_999) }

        it 'RecordNotFoundが発生する' do
          expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
        end
      end
    end
  end
end
