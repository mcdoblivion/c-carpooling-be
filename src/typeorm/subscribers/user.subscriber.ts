import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm'
import { UserEntity, WalletEntity } from '../entities'

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<UserEntity> {
  listenTo() {
    return UserEntity
  }

  async afterInsert(event: InsertEvent<UserEntity>): Promise<any> {
    try {
      console.log(`Creating user's wallet...`)

      const userId = event.entity.id

      const walletRepository =
        event.queryRunner.manager.getRepository(WalletEntity)
      const wallet = await walletRepository.findOne({
        where: {
          userId,
        },
      })

      if (!wallet) {
        await walletRepository.save({
          userId,
          currentBalance: 0,
          lifetimeBalance: 0,
        })

        console.log(`Create user's wallet successfully!`)
      }
    } catch (error) {
      console.log(`Create user's wallet failed!`)
    }
  }
}
