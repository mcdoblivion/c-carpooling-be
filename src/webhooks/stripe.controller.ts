import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  LoggerService,
  Post,
  Req,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiTags } from '@nestjs/swagger'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { WalletTransactionService } from 'src/modules/wallet-transaction/wallet-transaction.service'
import { StripeService } from 'src/services/stripe/stripe.service'
import Stripe from 'stripe'

@ApiTags('Webhook')
@Controller()
export class StripeController {
  constructor(
    private readonly config: ConfigService,
    private readonly stripeService: StripeService,
    private readonly walletTransactionService: WalletTransactionService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  async updateWalletTransaction(
    @Req() req: { rawBody: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    try {
      const stripeWebhookSecret = this.config.get<string>(
        'STRIPE_WEBHOOK_SECRET',
      )

      let event: Stripe.Event

      try {
        event = this.stripeService.webhooks.constructEvent(
          req.rawBody,
          signature,
          stripeWebhookSecret,
        )
      } catch (err) {
        this.logger.error(`Webhook signature verification failed!`)

        throw new BadRequestException(`Webhook signature verification failed!`)
      }

      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const {
        metadata: { walletTransactionId },
      } = paymentIntent

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          this.logger.log(`Payment Intent ${paymentIntent.id} was successful!`)

          await this.walletTransactionService.completeWalletTransaction(
            +walletTransactionId,
          )
          break

        case 'payment_intent.canceled':
          this.logger.log(`Payment Intent ${paymentIntent.id} was canceled!`)

          await this.walletTransactionService.cancelWalletTransaction(
            +walletTransactionId,
          )
          break

        case 'payment_intent.processing':
          this.logger.log(`Payment Intent ${paymentIntent.id} is processing!`)

          break

        default:
          // Unexpected event type
          this.logger.log(`Unhandled event type ${event.type}.`)
      }

      return true
    } catch (error) {
      throw new BadRequestException(error)
    }
  }
}
