import { motion } from 'framer-motion';
import { Leaf, Recycle, Heart, Shield } from 'lucide-react';

export default function BrandStory() {
  const features = [
    {
      icon: Leaf,
      title: 'Sustainable Sourcing',
      description: 'We partner with ethical suppliers who share our commitment to environmental responsibility',
    },
    {
      icon: Recycle,
      title: 'Eco-Friendly Materials',
      description: 'All our fabrics are sourced from sustainable and renewable resources',
    },
    {
      icon: Heart,
      title: 'Ethical Production',
      description: 'Fair wages and safe working conditions for everyone in our supply chain',
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'Every piece is crafted to last, reducing waste and promoting conscious consumption',
    },
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-2xl overflow-hidden">
              <img
                src="https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg"
                alt="Sustainable Fashion"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-gradient-to-br from-[#00CFFF] to-blue-500 rounded-2xl -z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Fashion That Cares
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                At Crysta, we believe that style and sustainability go hand in hand.
                Every garment is a testament to our commitment to quality, ethics, and
                the environment.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-[#00CFFF]/10 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-[#00CFFF]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
              Learn More About Us
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
