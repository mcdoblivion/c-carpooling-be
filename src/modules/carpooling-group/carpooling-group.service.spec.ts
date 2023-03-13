import { Test, TestingModule } from '@nestjs/testing'
import { CarpoolingGroupService } from './carpooling-group.service'

describe('TestService', () => {
  let service: CarpoolingGroupService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarpoolingGroupService],
    }).compile()

    service = module.get<CarpoolingGroupService>(CarpoolingGroupService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
