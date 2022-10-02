import { Controller } from '@nestjs/common'
import { PaymentMethodService } from './payment-method.service'

@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}
}
